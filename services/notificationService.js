import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import messageStorage from '../utils/messageStorage';

/**
 * Configure how notifications are handled when the app is foregrounded.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    console.log('[NotificationService] Foreground data:', data);
    
    // Check for mute status if it's a message
    const targetRoomId = data?.roomId || data?.groupId || data?.senderCid || data?.fromCid;
    if (data && (data.type === 'message' || data.type === 'chat') && targetRoomId) {
      const isMuted = await messageStorage.getMuteStatus(targetRoomId);
      console.log(`[NotificationService] Room ${targetRoomId} isMuted?`, isMuted);
      if (isMuted) {
        console.log(`[NotificationService] Suppressing foreground alert for muted room: ${targetRoomId}`);
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    }

    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const [silent, soundEnabled, vibrateEnabled] = await Promise.all([
        AsyncStorage.getItem('losky_silent_notif'),
        AsyncStorage.getItem('losky_sound'),
        AsyncStorage.getItem('losky_vibrate'),
      ]);

      // Silent mode: show alert (so user knows something came in) but no sound
      if (silent === 'true') {
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
        };
      }

      // Respect individual sound / vibration settings
      // null means the user hasn't changed it yet — default to enabled (true)
      const playSound = soundEnabled !== 'false';

      return {
        shouldShowAlert: true,
        shouldPlaySound: playSound,
        shouldSetBadge: true,
      };
    } catch (e) {
      console.warn('[NotificationService] Failed to read notification settings', e);
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

/**
 * Register the device for push notifications and return the Expo Push Token.
 *
 * FIX: Also persists the token to AsyncStorage ('losky_push_token') so that
 * CIDContext can pre-load it on the NEXT app start — breaking the race condition
 * where socketService.registerUser() fires before the token is available.
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.error('Failed to get push token for push notification!');
      return null;
    }

    // Project ID is required for newer Expo versions to fetch tokens correctly
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = deviceToken.data;
      console.log('FCM Device Push Token:', token);

      // ── Persist token so CIDContext can pre-load it on next start ─────────
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('losky_push_token', token);
        console.log('[NotificationService] Push token persisted to AsyncStorage.');
      } catch (storageErr) {
        console.warn('[NotificationService] Failed to persist push token:', storageErr);
      }
    } catch (e) {
      console.error('Critical failure in token generation:', e);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Listens for incoming notifications while the app is in the foreground.
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listens for user interaction with a notification (tapping it).
 */
export function addNotificationResponseReceivedListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Removes notification listeners.
 */
export function removeNotificationSubscription(subscription) {
  if (subscription && subscription.remove) {
    subscription.remove();
  }
}
