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
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

/**
 * NotificationsSettingsScreen - Screen 61
 * Control notification preferences and behavior
 */
export default function NotificationsSettingsScreen({ navigation }) {
  const [silentNotifications, setSilentNotifications] = useState(true);
  const [showSenderName, setShowSenderName] = useState(false);
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Section */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.primary} />
            <Text style={styles.previewTitle}>Preview</Text>
          </View>
          <View style={styles.notificationPreview}>
            <View style={styles.notifContent}>
              <Text style={styles.notifSender}>Locksy</Text>
              <Text style={styles.notifMessage}>New message · Content hidden</Text>
            </View>
          </View>
        </View>

        {/* Main Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATION SETTINGS</Text>

          {/* Silent Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.icon, { backgroundColor: COLORS.success + '15' }]}>
                <MaterialCommunityIcons name="bell-off" size={20} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Silent Notifications</Text>
                <Text style={styles.settingDescription}>No sender name or content shown</Text>
              </View>
            </View>
            <Switch
              value={silentNotifications}
              onValueChange={setSilentNotifications}
              trackColor={{ false: COLORS.gray200, true: COLORS.success + '40' }}
              thumbColor={silentNotifications ? COLORS.success : COLORS.gray300}
            />
          </View>

          {/* Show Sender Name */}
          <View 
            style={[
              styles.settingItem, 
              silentNotifications && styles.settingItemDisabled
            ]}
            pointerEvents={silentNotifications ? 'none' : 'auto'}
          >
            <View style={styles.settingContent}>
              <View style={[styles.icon, { backgroundColor: COLORS.primary + '15', opacity: silentNotifications ? 0.5 : 1 }]}>
                <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
              </View>
              <View style={{ opacity: silentNotifications ? 0.5 : 1 }}>
                <Text style={styles.settingLabel}>Show sender name</Text>
                <Text style={styles.settingDescription}>Display who sent the message</Text>
              </View>
            </View>
            <Switch
              value={showSenderName}
              onValueChange={setShowSenderName}
              disabled={silentNotifications}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary + '40' }}
              thumbColor={showSenderName ? COLORS.primary : COLORS.gray300}
            />
          </View>

          {/* Show Message Preview */}
          <View 
            style={[
              styles.settingItem,
              silentNotifications && styles.settingItemDisabled
            ]}
            pointerEvents={silentNotifications ? 'none' : 'auto'}
          >
            <View style={styles.settingContent}>
              <View style={[styles.icon, { backgroundColor: COLORS.warning + '15', opacity: silentNotifications ? 0.5 : 1 }]}>
                <MaterialCommunityIcons name="message-outline" size={20} color={COLORS.warning} />
              </View>
              <View style={{ opacity: silentNotifications ? 0.5 : 1 }}>
                <Text style={styles.settingLabel}>Show message preview</Text>
                <Text style={styles.settingDescription}>Display message content</Text>
              </View>
            </View>
            <Switch
              value={showMessagePreview}
              onValueChange={setShowMessagePreview}
              disabled={silentNotifications}
              trackColor={{ false: COLORS.gray200, true: COLORS.warning + '40' }}
              thumbColor={showMessagePreview ? COLORS.warning : COLORS.gray300}
            />
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOUND & VIBRATION</Text>

          {/* Sound */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.icon, { backgroundColor: COLORS.warning + '15' }]}>
                <MaterialCommunityIcons name="volume-high" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.settingLabel}>Sound</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: COLORS.gray200, true: COLORS.warning + '40' }}
              thumbColor={soundEnabled ? COLORS.warning : COLORS.gray300}
            />
          </View>

          {/* Vibration */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.icon, { backgroundColor: COLORS.primary + '15' }]}>
                <MaterialCommunityIcons name="vibrate" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.settingLabel}>Vibration</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary + '40' }}
              thumbColor={vibrationEnabled ? COLORS.primary : COLORS.gray300}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="lock" size={16} color={COLORS.encryptionText} />
          <Text style={styles.infoText}>
            Notification content never sent to servers. All processing local.
          </Text>
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
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  previewTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: SPACING.md,
  },
  notificationPreview: {
    backgroundColor: COLORS.dark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  notifContent: {
    backgroundColor: COLORS.dark,
  },
  notifSender: {
    ...TYPOGRAPHY.body3,
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  notifMessage: {
    ...TYPOGRAPHY.body3,
    color: COLORS.gray400,
  },
  section: {
    marginBottom: SPACING.xl,
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
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  settingDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.encryptionBg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.encryptionBorder,
  },
  infoText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.encryptionText,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});
