import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { isScreenshotBlockEnabled, setScreenshotBlockEnabled, isScreenRecordingBlockEnabled, setScreenRecordingBlockEnabled } from '../utils/secureStorage';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCIDContext } from './CIDContext';

const SecurityContext = createContext();

export const SecurityProvider = ({ children }) => {
  const [screenshotBlockEnabled, setScreenshotBlockEnabledState] = useState(true);
  const [screenRecordingBlockEnabled, setScreenRecordingBlockEnabledState] = useState(true);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState(60000); // Default 1 min
  const [isLoading, setIsLoading] = useState(true);
  
  const { lock, isUnlocked } = useCIDContext();
  const lastActiveTimeRef = useRef(Date.now());
  const appState = useRef(AppState.currentState);

  // Initialize settings from storage
  useEffect(() => {
    const initSettings = async () => {
      try {
        const [screenshot, recording, timeout] = await Promise.all([
          isScreenshotBlockEnabled(),
          isScreenRecordingBlockEnabled(),
          AsyncStorage.getItem('losky_auto_lock_timeout')
        ]);
        setScreenshotBlockEnabledState(screenshot);
        setScreenRecordingBlockEnabledState(recording);
        if (timeout) setAutoLockTimeoutState(parseInt(timeout, 10));
      } catch (error) {
        console.error('[SecurityContext] Failed to load security settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initSettings();
  }, []);

  // Monitor AppState for Auto-Lock
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[SecurityContext] App has come to the foreground!');
        
        // Check inactivity
        const now = Date.now();
        const inactiveDuration = now - lastActiveTimeRef.current;
        console.log(`[SecurityContext] Inactive for: ${inactiveDuration}ms (Timeout: ${autoLockTimeout}ms)`);
        
        if (isUnlocked && autoLockTimeout > 0 && inactiveDuration > autoLockTimeout) {
          console.log('[SecurityContext] Timeout reached! Locking app...');
          lock();
        }
      }

      if (nextAppState.match(/inactive|background/)) {
        lastActiveTimeRef.current = Date.now();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [autoLockTimeout, isUnlocked, lock]);

  // Monitor changes and apply capture prevention
  useEffect(() => {
    if (isLoading) return;

    // Apply blocking if EITHER is enabled (since they share the same API in Expo)
    const shouldBlock = screenshotBlockEnabled || screenRecordingBlockEnabled;

    if (shouldBlock) {
      console.log('[SecurityContext] Enabling screen capture protection');
      ScreenCapture.preventScreenCaptureAsync().catch(err => 
        console.error('[SecurityContext] Failed to prevent capture:', err)
      );
    } else {
      console.log('[SecurityContext] Disabling screen capture protection');
      ScreenCapture.allowScreenCaptureAsync().catch(err => 
        console.error('[SecurityContext] Failed to allow capture:', err)
      );
    }
  }, [screenshotBlockEnabled, screenRecordingBlockEnabled, isLoading]);

  const toggleScreenshotBlock = async (value) => {
    try {
      setScreenshotBlockEnabledState(value);
      await setScreenshotBlockEnabled(value);
    } catch (error) {
      console.error('[SecurityContext] Failed to save screenshot setting:', error);
    }
  };

  const toggleScreenRecordingBlock = async (value) => {
    try {
      setScreenRecordingBlockEnabledState(value);
      await setScreenRecordingBlockEnabled(value);
    } catch (error) {
      console.error('[SecurityContext] Failed to save recording setting:', error);
    }
  };

  const updateAutoLockTimeout = async (ms) => {
    try {
      setAutoLockTimeoutState(ms);
      await AsyncStorage.setItem('losky_auto_lock_timeout', String(ms));
    } catch (error) {
      console.error('[SecurityContext] Failed to save auto-lock timeout:', error);
    }
  };

  const value = {
    screenshotBlockEnabled,
    toggleScreenshotBlock,
    screenRecordingBlockEnabled,
    toggleScreenRecordingBlock,
    autoLockTimeout,
    updateAutoLockTimeout,
    isLoading
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
