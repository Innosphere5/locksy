import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

/**
 * ChangePasswordScreen - Screen 57
 * Change master password with verification and strength indicator
 */
export default function ChangePasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1=Verify, 2=New, 3=Confirm
  const [currentPass, setCurrentPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [confirmPass, setConfirmPass] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: 'Enter password', color: COLORS.textMuted };
    if (password.length < 8) return { strength: 1, label: 'Too short', color: COLORS.error };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      return { strength: 2, label: 'Medium', color: COLORS.warning };
    }
    return { strength: 3, label: 'Strong', color: COLORS.success };
  };

  const strength = getPasswordStrength(newPass);

  const handleVerifyPassword = () => {
    if (currentPass.length === 0) {
      Alert.alert('Error', 'Enter current password first');
      return;
    }
    setStep(2);
  };

  const handleSetNewPassword = () => {
    if (newPass.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setStep(3);
  };

  const handleUpdatePassword = () => {
    if (newPass !== confirmPass) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    Alert.alert('Success', 'Password updated successfully!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicators */}
        <View style={styles.stepsContainer}>
          <View style={[styles.step, step >= 1 && styles.stepActive]}>
            <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
            <Text style={styles.stepLabel}>Verify</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.step, step >= 2 && styles.stepActive]}>
            <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>
            <Text style={styles.stepLabel}>New</Text>
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.step, step >= 3 && styles.stepActive]}>
            <Text style={[styles.stepNumber, step >= 3 && styles.stepNumberActive]}>3</Text>
            <Text style={styles.stepLabel}>Confirm</Text>
          </View>
        </View>

        {/* Step 1: Verify Current Password */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Verify your current password first</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  value={currentPass}
                  onChangeText={setCurrentPass}
                  secureTextEntry={!showCurrent}
                  selectionColor={COLORS.primary}
                  placeholderTextColor={COLORS.placeholder}
                />
                <TouchableOpacity 
                  onPress={() => setShowCurrent(!showCurrent)}
                  style={styles.eyeBtn}
                >
                  <Ionicons 
                    name={showCurrent ? 'eye' : 'eye-off'} 
                    size={18} 
                    color={COLORS.textMuted} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: New Password */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create a new password</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry={!showNew}
                  selectionColor={COLORS.primary}
                  placeholderTextColor={COLORS.placeholder}
                />
                <TouchableOpacity 
                  onPress={() => setShowNew(!showNew)}
                  style={styles.eyeBtn}
                >
                  <Ionicons 
                    name={showNew ? 'eye' : 'eye-off'} 
                    size={18} 
                    color={COLORS.textMuted} 
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength */}
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthFill,
                      { 
                        width: `${(strength.strength / 3) * 100}%`,
                        backgroundColor: strength.color
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.strengthText, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            </View>

            {/* Requirements */}
            <View style={styles.requirementsBox}>
              <RequirementItem 
                met={newPass.length >= 8} 
                text="8+ characters" 
              />
              <RequirementItem 
                met={/[A-Z]/.test(newPass)} 
                text="Letters + numbers" 
              />
              <RequirementItem 
                met={/[!@#$%^&*]/.test(newPass)} 
                text="Special characters" 
              />
            </View>
          </View>
        )}

        {/* Step 3: Confirm Password */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirm your new password</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Repeat new password"
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  secureTextEntry={!showConfirm}
                  selectionColor={COLORS.primary}
                  placeholderTextColor={COLORS.placeholder}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                >
                  <Ionicons 
                    name={showConfirm ? 'eye' : 'eye-off'} 
                    size={18} 
                    color={COLORS.textMuted} 
                  />
                </TouchableOpacity>
              </View>
              {confirmPass && confirmPass !== newPass && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
              {confirmPass === newPass && confirmPass !== '' && (
                <Text style={styles.successText}>✓ Passwords match</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity 
            style={styles.backActionBtn}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backActionBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={
            step === 1 ? handleVerifyPassword :
            step === 2 ? handleSetNewPassword :
            handleUpdatePassword
          }
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {step === 3 ? 'Update Password' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const RequirementItem = ({ met, text }) => (
  <View style={styles.requirementItem}>
    <MaterialCommunityIcons 
      name={met ? 'check-circle' : 'circle-outline'} 
      size={16} 
      color={met ? COLORS.success : COLORS.gray300}
    />
    <Text style={[styles.requirementText, !met && styles.requirementTextInactive]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepActive: {
    opacity: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 32,
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  stepNumberActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  stepLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.gray200,
    marginHorizontal: SPACING.sm,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepContent: {
    marginBottom: SPACING.xl,
  },
  stepTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
  eyeBtn: {
    padding: SPACING.sm,
  },
  strengthContainer: {
    marginTop: SPACING.md,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray200,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    ...TYPOGRAPHY.body3,
    fontWeight: '600',
  },
  requirementsBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  requirementText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.success,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  requirementTextInactive: {
    color: COLORS.textMuted,
  },
  errorText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  successText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.success,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  backActionBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backActionBtnText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  nextButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
});
