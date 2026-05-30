import React, { useEffect } from 'react';
import * as NotificationService from '../../services/notificationService';
import { useCIDContext } from '../../context/CIDContext';
import { navigationRef } from '../utils/navigation';
import useCallStore from '../store/useCallStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messageStorage from '../../utils/messageStorage';

import signalingService from '../services/signalingService';
import socketService from '../../utils/socketService';

const NotificationHandler = () => {
  const { setPushToken, cid } = useCIDContext();
  const callStatus = useCallStore(state => state.callStatus);

  useEffect(() => {
    // Initialize signaling listeners once
    signalingService.init();
  }, []);

  const _handleIncomingCallOffer = (data) => {
    const { callId, callerName, callType, callerId, fromCid, senderCid } = data;
    const remoteId = callerId || fromCid || senderCid;
    
    console.log("[NotificationHandler] Handling incoming call offer:", callId);
    
    if (useCallStore.getState().callStatus !== 'idle') {
      console.warn("[NotificationHandler] Already in a call, ignoring offer");
      return;
    }

    // Populate store with incoming call info
    useCallStore.getState().setCallId(callId);
    useCallStore.getState().setCallType(callType);
    useCallStore.getState().setCallStatus('ringing');
    useCallStore.getState().setIsIncoming(true);
    useCallStore.getState().setRemoteUser({
      id: remoteId,
      name: callerName || 'Unknown',
      avatar: '👤',
    });

    // Navigate to incoming call screen
    if (navigationRef.isReady()) {
      navigationRef.navigate('IncomingCall');
    }
  };

  useEffect(() => {
    if (callStatus === 'ringing') {
      if (navigationRef.isReady()) {
        navigationRef.navigate('IncomingCall');
      }
    }
  }, [callStatus]);

  useEffect(() => {
    // Run maintenance tasks on startup
    messageStorage.pruneExpiredMessages();
    const pruneInterval = setInterval(() => {
      messageStorage.pruneExpiredMessages();
    }, 60000); // Check every minute
    
    return () => clearInterval(pruneInterval);
  }, []);

  useEffect(() => {
    if (cid) {
      console.log("[NotificationHandler] User identified, signaling active for:", cid);
    }
  }, [cid]);

  useEffect(() => {
    let isMounted = true;

    async function setupNotifications() {
      try {
        const token = await NotificationService.registerForPushNotificationsAsync();
        if (token && isMounted) {
          console.log("[NotificationHandler] FCM Token obtained:", token);
          setPushToken(token);
        }
      } catch (error) {
        console.error("[NotificationHandler] Error setting up notifications:", error);
      }
    }

    setupNotifications();

    const notificationListener = NotificationService.addNotificationReceivedListener(
      async (notification) => {
        console.log("[NotificationHandler] Notification Received:", notification.request.content.title);
        const data = notification.request.content.data;
        
        // SignalingService now handles the logic, we just ensure the screen is shown
        if (data.type === 'call_offer' || data.type === 'call') {
          if (useCallStore.getState().callStatus === 'ringing') {
            if (navigationRef.isReady()) {
              navigationRef.navigate('IncomingCall');
            }
          }
          return;
        }

        // Handle message notification privacy
        if (data.type === 'message') {
          const roomId = data.roomId || data.groupId || data.senderCid || data.fromCid;
          if (roomId) {
            const isMuted = await messageStorage.getMuteStatus(roomId);
            if (isMuted) {
              console.log(`[NotificationHandler] Room ${roomId} is muted. Suppressing notification.`);
              return;
            }
          }

          const silent = await AsyncStorage.getItem('losky_silent_notif');
          const showPreview = await AsyncStorage.getItem('losky_show_preview');
          const showSender = await AsyncStorage.getItem('losky_show_sender');

          if (silent === 'true' || showPreview === 'false') {
             console.log("[NotificationHandler] Privacy mode: Masking foreground notification");
          }
        }
      }
    );

    const responseListener = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log("[NotificationHandler] Notification Tapped:", response);
        const data = response.notification.request.content.data;
        if (data.type === 'call_offer' || data.type === 'call') {
          _handleIncomingCallOffer(data);
        }
      }
    );

    return () => {
      isMounted = false;
      NotificationService.removeNotificationSubscription(notificationListener);
      NotificationService.removeNotificationSubscription(responseListener);
    };
  }, [setPushToken]);

  return null;
};

export default NotificationHandler;
