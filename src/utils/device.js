import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'locksy_device_id';

/**
 * Gets the device ID. 
 * On Android, uses androidId.
 * On iOS, uses something consistent or generates a persistent UUID.
 */
export const getDeviceId = async () => {
  try {
    let deviceId = null;

    if (Platform.OS === 'android') {
      deviceId = Application.androidId;
    } else if (Platform.OS === 'ios') {
      // iOS doesn't have a direct equivalent to androidId that's guaranteed persistent across installs
      // for all use cases, so we'll check SecureStore first.
      deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    }

    // If still null (or iOS first run), generate and store a random ID
    if (!deviceId) {
      deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      
      if (!deviceId) {
        deviceId = `LKSY-${uuidv4()}`;
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      }
    }

    return deviceId;
  } catch (error) {
    console.error('[Device] Error getting device ID:', error);
    // Fallback to random if everything fails
    const fallbackId = `FALLBACK-${Math.random().toString(36).substring(7)}`;
    return fallbackId;
  }
};
