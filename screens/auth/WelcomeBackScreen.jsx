// screens/auth/WelcomeBackScreen.jsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Vibration,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useCIDContext } from '../../context/CIDContext';

/**
 * WelcomeBackScreen — CID Architecture Implementation
 *
 * Login flow:
 *  1. User enters password
 *  2. verifyAndUnlock() is called:
 *     - Loads encrypted CID bundle from storage
 *     - Derives PBKDF2 key (600K iterations)
 *     - Decrypts CID with AES-256-GCM
 *     - Verifies SHA-256 integrity hash
 *  3. 'success'      → navigate to Chats
 *     'wrong_password' → shake + show remaining attempts → navigate WrongPassword if attempts > 1
 *     'nuke'         → ALL DATA DESTROYED → navigate AccessDenied
 *
 * Password is NEVER stored and NEVER sent to a server.
 */
export default function WelcomeBackScreen({ navigation }) {
  const { verifyAndUnlock, failCount } = useCIDContext();
  const [password,       setPassword]       = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [shake]                             = useState(new Animated.Value(0));

  const remainingAttempts = Math.max(0, 3 - failCount);

  const triggerShake = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!password || isLoading) return;

    setIsLoading(true);
    try {
      // Real PBKDF2 decrypt + SHA-256 integrity check
      const result = await verifyAndUnlock(password);

      switch (result) {
        case 'success':
          navigation.replace('Chats');
          break;

        case 'nuke':
          // All data destroyed on 3rd wrong attempt
          navigation.replace('AccessDenied');
          break;

        case 'wrong_password':
        default:
          triggerShake();
          setPassword('');
          // Navigate to WrongPassword screen for remaining-attempts UI
          navigation.navigate('WrongPassword');
          break;
      }
    } catch (error) {
      console.error('[WelcomeBack] Login error:', error);
      triggerShake();
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.iconWrap}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>Locksy</Text>
            </View>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your master password to unlock</Text>

          {/* Attempt warning banner */}
          {failCount > 0 && (
            <View style={styles.attemptBanner}>
              <Text style={styles.attemptText}>
                ⚠️ {failCount} of 3 attempts used · {remainingAttempts} remaining
              </Text>
              {remainingAttempts === 1 && (
                <Text style={styles.nukeWarning}>
                  Next wrong attempt will destroy all data
                </Text>
              )}
            </View>
          )}

          {/* Password input */}
          <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shake }] }]}>
            <View style={[styles.inputBox, passwordFocused && styles.inputBoxFocused]}>
              <Text style={styles.inputEmoji}>🗝️</Text>
              <TextInput
                style={styles.hiddenInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter master password"
                placeholderTextColor="#94A3B8"
                onSubmitEditing={handleLogin}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeEmoji}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginBtn, (!password || isLoading) && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={!password || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginText}>Unlock</Text>
            )}
          </TouchableOpacity>

          {/* Loading hint */}
          {isLoading && (
            <Text style={styles.loadingHint}>
              Deriving key (PBKDF2 · 600K iterations)...
            </Text>
          )}

          {/* Security note */}
          <View style={styles.securityNote}>
            <Text style={styles.securityNoteText}>
              🔒 AES-256-GCM · Zero Server · 100% Local
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
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
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
    textAlign: 'center',
  },
  attemptBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  attemptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  nukeWarning: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: 12,
  },
  inputBoxFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  inputEmoji: { fontSize: 20 },
  hiddenInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    letterSpacing: 1.5,
  },
  eyeBtn: { padding: 4 },
  eyeEmoji: { fontSize: 18 },
  loginBtn: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingHint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 12,
  },
  securityNote: {
    marginTop: 'auto',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    width: '100%',
  },
  securityNoteText: {
    fontSize: 12,
    color: '#15803D',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});