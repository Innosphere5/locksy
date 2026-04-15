// screens/auth/WrongPasswordScreen.jsx
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
import { useCIDContext } from '../../context/CIDContext';
import { nukeAllData } from '../../utils/secureStorage';
import PinPad from '../common/PinPad';

const PIN_LENGTH = 4;

/**
 * WrongPasswordScreen — CID Architecture Implementation
 *
 * Shown after the first or second wrong password attempt.
 * Reads the REAL fail count from CIDContext (not hardcoded).
 *
 * On pin submit → calls verifyAndUnlock() again:
 *   success      → Chats
 *   wrong_password → shake, increment counter (already done in context)
 *   nuke         → ALL DATA DESTROYED → navigate AccessDenied
 *
 * Per design: "3 Wrong Passwords = ALL DATA DESTROYED — No recovery"
 */
export default function WrongPasswordScreen({ navigation }) {
  const { verifyAndUnlock, failCount } = useCIDContext();
  const [pin,       setPin]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake]                   = useState(new Animated.Value(0));

  const maxAttempts     = 3;
  const attemptsUsed    = failCount;
  const attemptsLeft    = Math.max(0, maxAttempts - attemptsUsed);
  const isFinalAttempt  = attemptsLeft <= 1;

  const triggerShake = () => {
    Vibration.vibrate([0, 80, 60, 80]);
    Animated.sequence([
      Animated.timing(shake, { toValue: 12,  duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8,   duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = async (key) => {
    if (isLoading) return;

    if (key === 'del') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 150)); // brief visual feedback

      try {
        const result = await verifyAndUnlock(newPin);

        switch (result) {
          case 'success':
            navigation.replace('Chats');
            break;

          case 'nuke':
            // 3 wrong attempts: all data nuked — go to AccessDenied
            navigation.replace('AccessDenied');
            break;

          case 'wrong_password':
          default:
            triggerShake();
            setPin('');
            break;
        }
      } catch (error) {
        console.error('[WrongPassword] Error:', error);
        triggerShake();
        setPin('');
      } finally {
        setIsLoading(false);
      }
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
        <View style={[styles.attemptBanner, isFinalAttempt && styles.attemptBannerCritical]}>
          <Text style={styles.attemptTitle}>
            {attemptsUsed} of {maxAttempts} attempts used
          </Text>
          <Text style={styles.attemptSub}>
            {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left before data wipe
          </Text>
        </View>

        {/* Dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shake }] }]}>
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

        {/* Loading indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#EF4444" size="large" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        ) : (
          <PinPad onKey={handleKey} />
        )}

        {/* Warning */}
        {isFinalAttempt && (
          <Text style={styles.warnText}>
            ⚠️ Next failure will permanently erase all data
          </Text>
        )}

        {/* Back to password entry */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Use password instead</Text>
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
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  attemptBannerCritical: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 2,
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
  dotEmpty:  { backgroundColor: '#E2E8F0' },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  warnText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  backBtn: {
    marginTop: 'auto',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  backText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
});