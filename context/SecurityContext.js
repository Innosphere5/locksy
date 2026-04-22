import React, { createContext, useContext, useState, useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { isScreenshotBlockEnabled, setScreenshotBlockEnabled, isScreenRecordingBlockEnabled, setScreenRecordingBlockEnabled } from '../utils/secureStorage';

const SecurityContext = createContext();

export const SecurityProvider = ({ children }) => {
  const [screenshotBlockEnabled, setScreenshotBlockEnabledState] = useState(true);
  const [screenRecordingBlockEnabled, setScreenRecordingBlockEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize settings from storage
  useEffect(() => {
    const initSettings = async () => {
      try {
        const [screenshot, recording] = await Promise.all([
          isScreenshotBlockEnabled(),
          isScreenRecordingBlockEnabled()
        ]);
        setScreenshotBlockEnabledState(screenshot);
        setScreenRecordingBlockEnabledState(recording);
      } catch (error) {
        console.error('[SecurityContext] Failed to load security settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initSettings();
  }, []);

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

  const value = {
    screenshotBlockEnabled,
    toggleScreenshotBlock,
    screenRecordingBlockEnabled,
    toggleScreenRecordingBlock,
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
