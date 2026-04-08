import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Vibration,
  Animated,
} from 'react-native';
import PinPad from '../common/PinPad';

const PIN_LENGTH = 3;
const CORRECT_PIN = '999'; // demo — nearly impossible

export default function WrongPasswordScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [shake] = useState(new Animated.Value(0));
  // Demo: already 2 of 3 attempts used
  const attemptsUsed = 2;
  const maxAttempts = 3;

  const triggerShake = () => {
    Vibration.vibrate([0, 80, 60, 80]);
    Animated.sequence([
      Animated.timing(shake, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = (key) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => {
        if (newPin === CORRECT_PIN) {
          navigation.replace('Chats');
        } else {
          triggerShake();
          setPin('');
          // 3rd wrong attempt → data wipe
          navigation.replace('AccessDenied');
        }
      }, 150);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🔒</Text>
          </View>
        </View>

        <Text style={styles.title}>Wrong Password</Text>

        {/* Attempt Banner */}
        <View style={styles.attemptBanner}>
          <Text style={styles.attemptTitle}>
            {attemptsUsed} of {maxAttempts} attempts used
          </Text>
          <Text style={styles.attemptSub}>
            {maxAttempts - attemptsUsed} attempt left before data wipe
          </Text>
        </View>

        {/* Dots */}
        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shake }] }]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
          ))}
        </Animated.View>

        {/* Keypad */}
        <PinPad onKey={handleKey} />

        {/* Warning */}
        <Text style={styles.warnText}>⚠️ Next failure erases all data</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconWrap: { marginBottom: 20 },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 34 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  attemptBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 28,
    width: '84%',
  },
  attemptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  attemptSub: {
    fontSize: 13,
    color: '#EF4444',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 36,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotFilled: { backgroundColor: '#EF4444' },
  dotEmpty: { backgroundColor: '#E2E8F0' },
  warnText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 24,
    fontWeight: '500',
  },
});