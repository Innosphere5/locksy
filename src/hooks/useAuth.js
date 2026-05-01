import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { validateSession, logout as apiLogout, nukeSession } from '../services/auth';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await validateSession();
      if (result.valid) {
        setIsAuthenticated(true);
        const employeeId = await SecureStore.getItemAsync('locksy_employee_id');
        setUser({ employeeId });
      } else {
        await handleNuke();
      }
      return result;
    } catch (error) {
      await handleNuke();
      return { valid: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNuke = async () => {
    await nukeSession();
    setIsAuthenticated(false);
    setUser(null);
  };

  const login = async (token, employeeId) => {
    await SecureStore.setItemAsync('locksy_token', token);
    await SecureStore.setItemAsync('locksy_employee_id', employeeId);
    setUser({ employeeId });
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await apiLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    checkSession,
    login,
    logout,
    handleNuke
  };
};
