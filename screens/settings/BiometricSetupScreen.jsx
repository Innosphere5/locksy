import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';
import { 
  isBiometricEnabled, 
  setBiometricEnabled, 
  saveBiometricSecret, 
  deleteBiometricSecret 
} from '../../utils/secureStorage';
import { useCIDContext } from '../../context/CIDContext';

/**
 * BiometricSetupScreen - Screen 58
 * Fully implemented biometric setup with FaceID/Fingerprint integration
 */
export default function BiometricSetupScreen({ navigation }) {
  const { verifyAndUnlock } = useCIDContext();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [authType, setAuthType] = useState('Biometrics');
  const [isLoading, setIsLoading] = useState(true);
  
  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    checkDeviceSupport();
    loadCurrentSetting();
  }, []);

  const checkDeviceSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setIsSupported(compatible);
      setEnrolled(enrolled);

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setAuthType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setAuthType('Fingerprint');
      } else {
        setAuthType('Biometrics');
      }
    } catch (e) {
      console.error('[BiometricSetup] Error checking support:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSetting = async () => {
    const enabled = await isBiometricEnabled();
    setIsEnabled(enabled);
  };

  const handleToggle = async (value) => {
    if (value) {
      // Enabling - Need password verification
      if (!isSupported) {
        Alert.alert('Not Supported', 'Your device does not support biometric authentication.');
        return;
      }
      if (!enrolled) {
        Alert.alert('Not Enrolled', 'Please set up Face ID or Fingerprint in your device settings first.');
        return;
      }
      setShowVerifyModal(true);
    } else {
      // Disabling - Simple toggle
      await setBiometricEnabled(false);
      await deleteBiometricSecret();
      setIsEnabled(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!password) return;
    
    setIsVerifying(true);
    try {
      // verifyAndUnlock returns 'success', 'wrong_password', or 'nuke'
      const result = await verifyAndUnlock(password);
      
      if (result === 'success') {
        // Correct password - Save for future biometric use
        await saveBiometricSecret(password);
        await setBiometricEnabled(true);
        setIsEnabled(true);
        setShowVerifyModal(false);
        setPassword('');
        Alert.alert('Success', `${authType} has been enabled.`);
      } else {
        Alert.alert('Error', 'Incorrect master password. Please try again.');
      }
    } catch (e) {
      console.error('[BiometricSetup] Auth error:', e);
      Alert.alert('Error', 'An unexpected error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biometric Lock</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Use your device's biometric authentication to unlock Locksy quickly. Your master password remains the primary key.
        </Text>

        {/* Status Info */}
        {!isSupported && (
          <View style={styles.warningCard}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.error} />
            <Text style={styles.warningText}>
              Biometric hardware not detected on this device.
            </Text>
          </View>
        )}

        {isSupported && !enrolled && (
          <View style={styles.warningCard}>
            <MaterialCommunityIcons name="information" size={24} color={COLORS.warning} />
            <Text style={[styles.warningText, { color: COLORS.warning }]}>
              No biometrics enrolled. Please set them up in your OS settings.
            </Text>
          </View>
        )}

        {/* Main Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <MaterialCommunityIcons 
                  name={authType === 'Face ID' ? 'face-recognition' : 'fingerprint'} 
                  size={32} 
                  color={isEnabled ? COLORS.primary : COLORS.textMuted} 
                />
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{authType} Unlock</Text>
                  <Text style={styles.cardDescription}>
                    Unlock the app with {authType.toLowerCase()}
                  </Text>
                </View>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggle}
                disabled={!isSupported || !enrolled}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary + '40' }}
                thumbColor={isEnabled ? COLORS.primary : COLORS.gray300}
              />
            </View>
          </View>
        </View>

        <View style={styles.noteBox}>
          <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.success} />
          <Text style={styles.noteText}>
            Locksy uses hardware-backed secure storage. Your password is only accessible after your biometric scan.
          </Text>
        </View>
      </ScrollView>

      {/* Password Verification Modal */}
      <Modal
        visible={showVerifyModal}
        transparent={true}
        animationType="fade"
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your master password to enable {authType}
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Master password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => {
                  setShowVerifyModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, !password && styles.disabledBtn]}
                onPress={handleVerifyPassword}
                disabled={!password || isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.confirmBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
  description: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  warningText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.error,
    flex: 1,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  cardDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.success + '05',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success + '20',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  noteText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.success,
    flex: 1,
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  input: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
