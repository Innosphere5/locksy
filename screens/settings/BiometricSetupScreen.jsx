import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

/**
 * BiometricSetupScreen - Screen 58
 * Setup fingerprint and face recognition
 */
export default function BiometricSetupScreen({ navigation }) {
  const [fingerprint, setFingerprint] = useState(true);
  const [faceId, setFaceId] = useState(false);
  const [passwordOnly, setPasswordOnly] = useState(false);

  const handleSetupBiometric = (type) => {
    if (type === 'fingerprint') {
      Alert.alert(
        'Fingerprint Setup',
        'Place your registered finger on the sensor',
        [{ text: 'OK', onPress: () => setFingerprint(true) }]
      );
    } else if (type === 'face') {
      Alert.alert(
        'Face ID Setup',
        'Position your face in the frame',
        [{ text: 'OK', onPress: () => setFaceId(true) }]
      );
    }
  };

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
          Password remains the master key. Biometrics unlock app with fingerprint.
        </Text>

        {/* Fingerprint Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fingerprint</Text>
            <Switch
              value={fingerprint}
              onValueChange={setFingerprint}
              trackColor={{ false: COLORS.gray200, true: COLORS.success + '40' }}
              thumbColor={fingerprint ? COLORS.success : COLORS.gray300}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.iconBig}>
              <MaterialCommunityIcons 
                name="fingerprint" 
                size={64} 
                color={COLORS.success} 
              />
            </View>
            <Text style={styles.cardTitle}>Enable Fingerprint</Text>
            <Text style={styles.cardDescription}>
              Unlock app with registered finger on the sensor
            </Text>
            {fingerprint && (
              <TouchableOpacity 
                style={styles.setupButton}
                onPress={() => handleSetupBiometric('fingerprint')}
              >
                <Text style={styles.setupButtonText}>Touch fingerprint sensor</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Face ID Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Face ID</Text>
            <Switch
              value={faceId}
              onValueChange={setFaceId}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary + '40' }}
              thumbColor={faceId ? COLORS.primary : COLORS.gray300}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.iconBig}>
              <MaterialCommunityIcons 
                name="face-recognition" 
                size={64} 
                color={COLORS.primary} 
              />
            </View>
            <Text style={styles.cardTitle}>Enable Face ID</Text>
            <Text style={styles.cardDescription}>
              Unlock app with your registered face
            </Text>
            {faceId && (
              <TouchableOpacity 
                style={styles.setupButton}
                onPress={() => handleSetupBiometric('face')}
              >
                <Text style={styles.setupButtonText}>Use password instead</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Password Only Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Password Only</Text>
            <Switch
              value={passwordOnly}
              onValueChange={setPasswordOnly}
              trackColor={{ false: COLORS.gray200, true: COLORS.warning + '40' }}
              thumbColor={passwordOnly ? COLORS.warning : COLORS.gray300}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.iconBig}>
              <MaterialCommunityIcons 
                name="lock" 
                size={64} 
                color={COLORS.warning} 
              />
            </View>
            <Text style={styles.cardTitle}>Disable biometrics</Text>
            <Text style={styles.cardDescription}>
              Unlock app only with password
            </Text>
            {passwordOnly && (
              <TouchableOpacity 
                style={styles.warnButton}
                onPress={() => Alert.alert('Warning', 'Password only is less secure')}
              >
                <MaterialCommunityIcons name="alert" size={16} color={COLORS.warning} />
                <Text style={styles.warnButtonText}>Password Only</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  description: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  iconBig: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  cardDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  setupButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  warnButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  warnButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.warning,
    fontWeight: '600',
  },
});
