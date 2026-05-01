import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAppConfig } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

const SplashScreen = ({ navigation }) => {
  const { checkSession, isAuthenticated, isLoading } = useAuth();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    initApp();
  }, []);

  const initApp = async () => {
    try {
      // 1. Check Backend Control
      const config = await getAppConfig();

      if (config && config.is_app_active === false) {
        navigation.replace('Blocked', { reason: 'APP_DISABLED' });
        return;
      }

      if (config.force_update) {
        navigation.replace('Blocked', { reason: 'FORCE_UPDATE' });
        return;
      }

      // 2. Validate Session
      const result = await checkSession();

      if (result && !result.valid) {
        if (result.reason === 'USER_DISABLED' || result.action === 'nuke') {
          navigation.replace('Blocked', { reason: result.action === 'nuke' ? 'USER_NUKE' : 'USER_BLOCKED' });
          return;
        }
        // For normal session expiry, just go to login
        navigation.replace('Login');
        return;
      }

      if (result && result.action === 'nuke') {
        navigation.replace('Blocked', { reason: 'USER_NUKE' });
        return;
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        const action = error.response.data?.action;
        navigation.replace('Blocked', { reason: action === 'nuke' ? 'USER_NUKE' : 'USER_BLOCKED' });
        return;
      }
      console.error('[Splash] Init error:', error);
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated !== null) {
      if (isAuthenticated) {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
    }
  }, [isLoading, isAuthenticated]);

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>LOCKSY</Text>
          <View style={styles.underline} />
        </View>
        <Text style={styles.tagline}>Secure. Bound. Professional.</Text>
        <View style={styles.loader} />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  underline: {
    height: 4,
    backgroundColor: '#3b82f6',
    width: '100%',
    borderRadius: 2,
    marginTop: -5,
  },
  tagline: {
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: 2,
    marginTop: 10,
  },
  loader: {
    marginTop: 50,
    height: 2,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  }
});

export default SplashScreen;
