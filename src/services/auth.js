import api from './api';
import { getDeviceId } from '../utils/device';
import * as SecureStore from 'expo-secure-store';

/**
 * Fetch app configuration (is_app_active, force_update)
 */
export const getAppConfig = async () => {
  try {
    const response = await api.get('app/config');
    return response.data;
  } catch (error) {
    console.error('[AuthService] Error fetching app config:', error);
    throw error;
  }
};

/**
 * Verify employee and device binding
 */
export const verifyUser = async (employeeId) => {
  try {
    const deviceId = await getDeviceId();
    const response = await api.post('auth/verify-user', {
      employee_id: employeeId,
      device_id: deviceId,
    });
    
    // Response format: { allowed: true, token: '...' }
    return response.data;
  } catch (error) {
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      console.error('[AuthService] Error verifying user:', error);
    }
    return { 
      allowed: false, 
      error: error.response?.data?.error || error.response?.data?.message || 'Verification failed',
      status: error.response?.status,
      action: error.response?.data?.action
    };
  }
};

/**
 * Validate current session with backend
 */
export const validateSession = async () => {
  try {
    const token = await SecureStore.getItemAsync('locksy_token');
    const deviceId = await getDeviceId();
    
    if (!token) return { valid: false };

    const response = await api.post('auth/validate-session', {
      device_id: deviceId,
    });
    
    // Response format: { valid: true }
    return response.data;
  } catch (error) {
    console.error('[AuthService] Session validation failed:', error);
    return { 
      valid: false,
      error: error.response?.data?.error,
      action: error.response?.data?.action
    };
  }
};

/**
 * Logout and clear everything
 */
export const logout = async () => {
  try {
    await api.post('auth/logout');
  } catch (error) {
    console.warn('[AuthService] Logout API failed:', error.message);
  } finally {
    // Always clear local data
    await SecureStore.deleteItemAsync('locksy_token');
    await SecureStore.deleteItemAsync('locksy_employee_id');
    // Note: We don't delete device_id as it's bound to the device
  }
};

/**
 * Hard security wipe
 */
export const nukeSession = async () => {
  await SecureStore.deleteItemAsync('locksy_token');
  await SecureStore.deleteItemAsync('locksy_employee_id');
};
