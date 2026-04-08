// onboardings/SetupMasterPassword.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from './theme';

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: COLORS.border };
  let score = 0;
  const hasLength = password.length >= 8;
  const hasLetterNum = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (hasLength) score++;
  if (hasLetterNum) score++;
  if (hasSpecial) score++;
  if (score === 1) return { level: 1, label: 'WEAK', color: '#EF4444', hasLength, hasLetterNum, hasSpecial };
  if (score === 2) return { level: 2, label: 'FAIR', color: '#F59E0B', hasLength, hasLetterNum, hasSpecial };
  return { level: 3, label: 'STRONG', color: '#16A34A', hasLength, hasLetterNum, hasSpecial };
}

export default function SetupMasterPassword({ navigation }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const strength = getPasswordStrength(password);
  const barWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const targetWidth = (strength.level / 3) * 100;
    Animated.timing(barWidth, {
      toValue: targetWidth,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [strength.level]);

  const handleContinue = () => {
    if (!password || !confirmPassword) {
      Alert.alert('Required', 'Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (strength.level < 2) {
      Alert.alert('Weak Password', 'Please create a stronger password.');
      return;
    }
    navigation.navigate('SetupNickname');
  };

  const renderDots = (value, focused) => {
    const count = Math.min(value.length, 8);
    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.inputDot,
              i < count && styles.inputDotFilled,
              focused && i === count - 1 && styles.inputDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step label */}
          <Text style={styles.stepLabel}>STEP 1 OF 3 — SECURITY</Text>

          {/* Heading */}
          <Text style={styles.title}>Create your{'\n'}master password</Text>
          <Text style={styles.subtitle}>Encrypts everything. Never stored.</Text>

          <View style={styles.divider} />

          {/* Password Field */}
          <Text style={styles.fieldLabel}>Password</Text>
          <View
            style={[
              styles.inputBox,
              passwordFocused && styles.inputBoxFocused,
            ]}
          >
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
              placeholderTextColor={COLORS.textMuted}
              maxLength={32}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeEmoji}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Field */}
          <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>Confirm</Text>
          <View
            style={[
              styles.inputBox,
              confirmFocused && styles.inputBoxFocused,
              confirmPassword && password !== confirmPassword && styles.inputBoxError,
            ]}
          >
            <Text style={styles.inputEmoji}>🔒</Text>
            <TextInput
              style={styles.hiddenInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Confirm password"
              placeholderTextColor={COLORS.textMuted}
              maxLength={32}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Text style={styles.eyeEmoji}>{showConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Strength Bar */}
          {password.length > 0 && (
            <View style={styles.strengthSection}>
              <View style={styles.strengthHeaderRow}>
                <Text style={styles.strengthLabel}>Strength</Text>
                <Text style={[styles.strengthValue, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
              <View style={styles.strengthTrack}>
                <Animated.View
                  style={[
                    styles.strengthBar,
                    {
                      width: barWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: strength.color,
                    },
                  ]}
                />
              </View>

              {/* Criteria */}
              <View style={styles.criteriaList}>
                <CriteriaRow met={strength.hasLength} label="8+ characters" />
                <CriteriaRow met={strength.hasLetterNum} label="Letters + numbers" />
                <CriteriaRow met={strength.hasSpecial} label="Special characters" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              (!password || !confirmPassword) && styles.ctaBtnDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function CriteriaRow({ met, label }) {
  return (
    <View style={styles.criteriaRow}>
      <Text style={[styles.criteriaCheck, met && styles.criteriaCheckMet]}>
        {met ? '✓' : '○'}
      </Text>
      <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 70 : 55,
    paddingBottom: 120,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 38,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: SPACING.sm,
  },
  inputBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  inputBoxError: {
    borderColor: '#EF4444',
  },
  inputEmoji: {
    fontSize: 20,
  },
  hiddenInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeEmoji: {
    fontSize: 18,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    alignItems: 'center',
  },
  inputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  inputDotFilled: {
    backgroundColor: COLORS.primary,
  },
  inputDotActive: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.2 }],
  },
  strengthSection: {
    marginTop: SPACING.xl,
  },
  strengthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  strengthValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  strengthTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  strengthBar: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  criteriaList: {
    gap: SPACING.xs,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  criteriaCheck: {
    fontSize: 14,
    color: COLORS.textMuted,
    width: 16,
  },
  criteriaCheckMet: {
    color: COLORS.success,
  },
  criteriaText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  criteriaTextMet: {
    color: COLORS.success,
    fontWeight: '600',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});