import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Vibration,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import PinPad from '../common/PinPad';
import { getChatLockStatus } from '../../utils/secureStorage';

const PIN_LENGTH = 6;

export default function UnlockChatScreen({ navigation, route }) {
  const contactName = route?.params?.contactName || 'Chat';
  const contactCid = route?.params?.contactCid;
  const onUnlockSuccess = route?.params?.onUnlockSuccess; // Optional callback

  const [pin, setPin] = useState('');
  const [targetPin, setTargetPin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shake] = useState(new Animated.Value(0));
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Load target PIN for this contact
        if (contactCid) {
          const status = await getChatLockStatus(contactCid);
          setTargetPin(status.lockPassword);
        } else {
          // Fallback/Demo
          setTargetPin('112233'); 
        }

        // Check biometrics
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(compatible && enrolled);

        if (compatible && enrolled) {
          // Auto-trigger biometrics
          handleBiometricAuth();
        }
      } catch (err) {
        console.error('[UnlockChat] Init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [contactCid]);

  const triggerShake = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleUnlock = () => {
    if (onUnlockSuccess) {
      onUnlockSuccess();
    } else {
      navigation.goBack();
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Unlock chat with ${contactName}`,
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        handleUnlock();
      }
    } catch (err) {
      console.warn('[UnlockChat] Biometric error:', err);
    }
  };

  const handleKey = (key) => {
    if (isLoading) return;

    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => {
        if (newPin === targetPin) {
          handleUnlock();
        } else {
          triggerShake();
          setPin('');
          // Maybe navigate to WrongPassword if too many fails, 
          // but for chat lock let's keep it simple for now.
        }
      }, 150);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Lock Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🔒</Text>
          </View>
        </View>

        <Text style={styles.title}>Unlock {contactName}</Text>
        <Text style={styles.subtitle}>Enter private password to access</Text>

        {/* Dots */}
        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shake }] }]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </Animated.View>

        {/* Keypad */}
        <PinPad onKey={handleKey} />

        {/* Biometrics text link */}
        {isBiometricSupported && (
          <TouchableOpacity 
            style={styles.bioLink} 
            activeOpacity={0.7}
            onPress={handleBiometricAuth}
          >
            <Text style={styles.bioText}>Use biometrics instead</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { justifyContent: 'center', alignItems: 'center' },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 40,
  },
  iconWrap: { marginBottom: 22 },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 34 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 32,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 40,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotFilled: { backgroundColor: '#3B82F6' },
  dotEmpty: { backgroundColor: '#E2E8F0' },
  bioLink: {
    marginTop: 28,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bioText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
});