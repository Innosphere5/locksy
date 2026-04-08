import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width: screenWidth } = Dimensions.get('screen');

/**
 * SecurityCenterScreen - Screen 54
 * Centralized security settings and monitoring
 * Shows encryption status, biometric settings, threats, etc.
 */
export default function SecurityCenterScreen({ navigation }) {
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [stealthMode, setStealthMode] = useState(true);
  const [screenshotBlock, setScreenshotBlock] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [wipeOnFail, setWipeOnFail] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Score Card */}
        <View style={styles.scoreCard}>
          <View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>94</Text>
            </View>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Security Score</Text>
            <Text style={styles.scoreStatus}>STRONG · All critical checks pass</Text>
          </View>
          <TouchableOpacity 
            style={styles.scoreButton}
            onPress={() => Alert.alert('Security', 'Detailed security report')}
          >
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Security Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY FEATURES</Text>

          {/* End-to-End Encryption */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.success + '18' }]}>
                <MaterialCommunityIcons name="lock-check" size={20} color={COLORS.success} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>End-to-End Encryption</Text>
                <Text style={styles.settingDescription}>All messages encrypted</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>

          {/* Stealth Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '18' }]}>
                <MaterialCommunityIcons name="eye-off" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Stealth Mode</Text>
                <Text style={styles.settingDescription}>Hide online & last seen</Text>
              </View>
            </View>
            <Switch
              value={stealthMode}
              onValueChange={setStealthMode}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary + '40' }}
              thumbColor={stealthMode ? COLORS.primary : COLORS.gray300}
            />
          </View>

          {/* Screenshot Block */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.warning + '18' }]}>
                <MaterialCommunityIcons name="camera-off" size={20} color={COLORS.warning} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Screenshot Block</Text>
                <Text style={styles.settingDescription}>Prevent screen capture</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusTextActive}>ACTIVE</Text>
            </View>
          </View>

          {/* Auto-Lock */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '18' }]}>
                <MaterialCommunityIcons name="lock" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Lock</Text>
                <Text style={styles.settingDescription}>Lock after 1 minute</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.settingValue}>1 MIN</Text>
            </TouchableOpacity>
          </View>

          {/* Message Timers */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.warning + '18' }]}>
                <MaterialCommunityIcons name="timer" size={20} color={COLORS.warning} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Message Timers</Text>
                <Text style={styles.settingDescription}>Auto-delete messages</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusTextManual}>MANUAL</Text>
            </View>
          </View>

          {/* Wipe on 3 Fails */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.success + '18' }]}>
                <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.success} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Wipe on 3 Fails</Text>
                <Text style={styles.settingDescription}>Auto-wipe on failed attempts</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusTextArmed}>ARMED</Text>
            </View>
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
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  scoreValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  scoreStatus: {
    ...TYPOGRAPHY.body3,
    color: COLORS.white,
    opacity: 0.9,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBotton: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  settingValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success + '15',
  },
  statusText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  statusTextActive: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.success,
    fontWeight: '600',
  },
  statusTextManual: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.warning,
    fontWeight: '600',
  },
  statusTextArmed: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.success,
    fontWeight: '600',
  },
});
