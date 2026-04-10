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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function WelcomeBackScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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

  const handleLogin = async () => {
    if (!password) return;
    
    try {
      const storedPassword = await SecureStore.getItemAsync('master_password');
      if (password === storedPassword) {
        navigation.replace('Chats');
      } else {
        triggerShake();
        setPassword('');
        // Optional depending on if you want a separate screen or just feedback
        // navigation.navigate('WrongPassword'); 
      }
    } catch (error) {
       console.error('Error getting stored password:', error);
       triggerShake();
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
          {/* Icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>Locksy</Text>
            </View>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your password</Text>

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
                placeholder="Enter password"
                placeholderTextColor="#94A3B8"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeEmoji}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <TouchableOpacity 
            style={[styles.loginBtn, !password && styles.loginBtnDisabled]} 
            onPress={handleLogin}
            disabled={!password}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotBtn} 
            onPress={() => navigation.navigate('SetupMasterPassword')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Biometrics */}
          <TouchableOpacity style={styles.bioBtn} activeOpacity={0.8}>
            <Text style={styles.bioEmoji}>☝️</Text>
            <Text style={styles.bioText}>Use fingerprint instead</Text>
          </TouchableOpacity>
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
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
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
  inputEmoji: {
    fontSize: 20,
  },
  hiddenInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    letterSpacing: 1.5,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeEmoji: {
    fontSize: 18,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  forgotBtn: {
    paddingVertical: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
    marginTop: 'auto',
    width: '100%',
    justifyContent: 'center',
  },
  bioEmoji: { fontSize: 22 },
  bioText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
});