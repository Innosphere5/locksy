import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as NotificationService from '../../services/notificationService';
import { useCIDContext } from '../../context/CIDContext';
import { navigationRef } from '../utils/navigation';
import useCallStore from '../store/useCallStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messageStorage from '../../utils/messageStorage';

import signalingService from '../services/signalingService';
import socketService from '../../utils/socketService';

/**
 * Wait for the navigation ref to be ready, retrying up to maxRetries times.
 * This is necessary because notification taps from a killed/background app
 * arrive before the navigator has mounted.
 */
const waitForNavigator = (maxRetries = 20, delayMs = 150) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      if (navigationRef.isReady()) {
        resolve();
      } else if (attempts >= maxRetries) {
        reject(new Error('[NotificationHandler] Navigator never became ready'));
      } else {
        attempts++;
        setTimeout(check, delayMs);
      }
    };
    check();
  });
};

const NotificationHandler = () => {
  const { setPushToken, cid, contacts } = useCIDContext();
  const callStatus = useCallStore(state => state.callStatus);
  const isIncoming = useCallStore(state => state.isIncoming);
  // Store contacts in a ref so the cold-start handler can access the latest value
  const contactsRef = useRef(contacts);
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    // Initialize signaling listeners once
    signalingService.init();
  }, []);

  const _handleIncomingCallOffer = (data) => {
    const { callId, callerName, callType, callerId, fromCid, senderCid } = data;
    const remoteId = callerId || fromCid || senderCid;

    if (useCallStore.getState().callStatus !== 'idle') {
      return;
    }

    useCallStore.getState().setCallId(callId);
    useCallStore.getState().setCallType(callType);
    useCallStore.getState().setCallStatus('ringing');
    useCallStore.getState().setIsIncoming(true);
    useCallStore.getState().setRemoteUser({
      id: remoteId,
      name: callerName || 'Unknown',
      avatar: '👤',
    });

    if (navigationRef.isReady()) {
      navigationRef.navigate('IncomingCall');
    }
  };

  /**
   * Navigate to the correct chat screen when a message notification is tapped.
   *
   * BUG FIXES applied here:
   *  1. Uses `chatId` (not `roomId`) to match what ChatMessageScreen reads from
   *     route.params.chatId.
   *  2. Uses `contactCID` (not `senderCid`) to match route.params.contactCID.
   *  3. Enriches params with contactName + contactAvatar from local contacts
   *     store so the header renders correctly.
   *  4. Waits for the navigator to be ready (retry loop) instead of silently
   *     bailing out — this fixes the killed-app / cold-start tap scenario.
   */
  const _handleMessageNotificationTap = async (data) => {
    const { roomId, groupId, senderCid } = data;

    try {
      await waitForNavigator();
    } catch (e) {
      console.warn('[NotificationHandler]', e.message);
      return;
    }

    if (groupId) {
      console.log('[NotificationHandler] Navigating to GroupChat:', groupId);
      // Use reset so a fresh GroupChat is guaranteed (avoids stale params)
      navigationRef.reset({
        index: 1,
        routes: [
          { name: 'Chats' },
          { name: 'GroupChat', params: { groupId } },
        ],
      });
      return;
    }

    if (!roomId) {
      // No room info at all — fall back to the Chats list
      navigationRef.navigate('Chats');
      return;
    }

    // Enrich with contact info from local store so the header shows
    // the correct name/avatar even when these params weren't in the notification.
    const knownContact = contactsRef.current.find(
      c => c.cid === senderCid || c.roomId === roomId
    );

    const params = {
      // ChatMessageScreen reads `chatId` — NOT `roomId`
      chatId: roomId,
      // ChatMessageScreen reads `contactCID` — NOT `senderCid`
      contactCID: senderCid,
      contactName: knownContact?.nickname || knownContact?.name || 'Chat',
      contactAvatar: knownContact?.avatar || '👤',
    };

    console.log('[NotificationHandler] Navigating to ChatMessage with params:', params);
    // Use reset instead of navigate to GUARANTEE a fresh ChatMessageScreen instance.
    // ChatMessageScreen reads roomId as a plain `const` on mount — if the screen is
    // already open for a different contact, navigate() updates params but the const
    // is already bound to the old value. reset() forces a brand-new screen mount.
    navigationRef.reset({
      index: 1,
      routes: [
        { name: 'Chats' },
        { name: 'ChatMessage', params },
      ],
    });
  };

  /**
   * Handle the COLD-START / KILLED-APP scenario:
   * When the user taps a notification while the app is not running,
   * Expo fires the response through getLastNotificationResponseAsync()
   * on mount — the addNotificationResponseReceivedListener alone is NOT
   * sufficient in this case.
   */
  useEffect(() => {
    let handled = false;

    const handleLastResponse = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (!response) return;

        const data = response.notification.request.content.data;
        if (!data) return;

        console.log('[NotificationHandler] Cold-start notification data:', data);

        if (data.type === 'call_offer' || data.type === 'call') {
          _handleIncomingCallOffer(data);
          handled = true;
          return;
        }

        if (data.type === 'message') {
          handled = true;
          await _handleMessageNotificationTap(data);
        }
      } catch (err) {
        console.error('[NotificationHandler] Error handling last notification:', err);
      }
    };

    handleLastResponse();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — intentionally no deps

  useEffect(() => {
    if (callStatus === 'ringing' && isIncoming) {
      if (navigationRef.isReady()) {
        navigationRef.navigate('IncomingCall');
      }
    }
  }, [callStatus, isIncoming]);

  useEffect(() => {
    // Run maintenance tasks on startup
    messageStorage.pruneExpiredMessages();
    const pruneInterval = setInterval(() => {
      messageStorage.pruneExpiredMessages();
    }, 60000);

    return () => clearInterval(pruneInterval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function setupNotifications() {
      try {
        const token = await NotificationService.registerForPushNotificationsAsync();
        if (token && isMounted) {
          setPushToken(token);
        }
      } catch (error) {
        console.error('[NotificationHandler] Error setting up notifications:', error);
      }
    }

    setupNotifications();

    // Foreground notification received
    const notificationListener = NotificationService.addNotificationReceivedListener(
      async (notification) => {
        const data = notification.request.content.data;

        if (data.type === 'call_offer' || data.type === 'call') {
          if (useCallStore.getState().callStatus === 'ringing') {
            if (navigationRef.isReady()) {
              navigationRef.navigate('IncomingCall');
            }
          }
          return;
        }

        if (data.type === 'message') {
          const targetRoomId = data.roomId || data.groupId;
          if (targetRoomId) {
            const isMuted = await messageStorage.getMuteStatus(targetRoomId);
            if (isMuted) {
              return;
            }
          }

          const silent = await AsyncStorage.getItem('losky_silent_notif');
          const showPreview = await AsyncStorage.getItem('losky_show_preview');

          if (silent === 'true' || showPreview === 'false') {
            console.log('[NotificationHandler] Privacy mode: masking foreground notification');
          }
        }
      }
    );

    // Background / foreground notification TAP
    const responseListener = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data.type === 'call_offer' || data.type === 'call') {
          _handleIncomingCallOffer(data);
          return;
        }

        if (data.type === 'message') {
          _handleMessageNotificationTap(data);
        }
      }
    );

    return () => {
      isMounted = false;
      NotificationService.removeNotificationSubscription(notificationListener);
      NotificationService.removeNotificationSubscription(responseListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPushToken]);

  return null;
};

export default NotificationHandler;
