import axios from 'axios';
import AppConfig from '../../config/appConfig';
import * as SecureStore from 'expo-secure-store';
import { replace } from '../utils/navigation';

const api = axios.create({
  baseURL: AppConfig.API.BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('locksy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle responses (unauthorized = logout)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or session expired - nuke locally
      await SecureStore.deleteItemAsync('locksy_token');
      await SecureStore.deleteItemAsync('locksy_employee_id');
      // Redirect to Login
      replace('Login');
    }
    return Promise.reject(error);
  }
);

export default api;
