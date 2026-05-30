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
      const silent = await AsyncStorage.getItem('losky_silent_notif');
      if (silent === 'true') {
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
        };
      }
    } catch (e) {
      console.warn('[NotificationService] Failed to read silent setting', e);
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

/**
 * Register the device for push notifications and return the FCM token.
 * This is production-ready logic with error handling and platform checks.
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
      // For production FCM, we fetch the device push token
      // Note: getDevicePushTokenAsync() returns the native token (FCM for Android, APNs for iOS)
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = deviceToken.data;
      console.log('Native Device Token (FCM):', token);
    } catch (e) {
      console.error('Error fetching FCM token:', e);

      // Fallback to Expo Push Token if native token fails (useful for debugging)
      try {
        const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
        token = expoToken.data;
        console.log('Fallback Expo Push Token:', token);
      } catch (err) {
        console.error('Critical failure in token generation:', err);
      }
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
