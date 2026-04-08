import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Vibration,
  Animated,
} from 'react-native';
import PinPad from '../common/PinPad';

const PIN_LENGTH = 6;
const CORRECT_PIN = '123456'; // demo

export default function WelcomeBackScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [shake] = useState(new Animated.Value(0));

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
          navigation.navigate('WrongPassword');
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
            <Text style={styles.iconText}>Locksy</Text>
          </View>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Enter your password</Text>

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

        {/* Biometrics */}
        <TouchableOpacity style={styles.bioBtn} activeOpacity={0.8}>
          <Text style={styles.bioEmoji}>☝️</Text>
          <Text style={styles.bioText}>Use fingerprint instead</Text>
        </TouchableOpacity>
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
  iconWrap: { marginBottom: 24 },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 32,
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
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
    marginTop: 24,
    width: '88%',
    justifyContent: 'center',
  },
  bioEmoji: { fontSize: 22 },
  bioText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
});