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
  Image,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCIDContext } from '../../context/CIDContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width: screenWidth } = Dimensions.get('screen');

/**
 * SettingsScreen - Screen 55
 * Main settings page with profile, security, and app options
 */
export default function SettingsScreen({ navigation }) {
  const [stealthMode, setStealthMode] = useState(true);
  const [defaultTimer, setDefaultTimer] = useState('1h');

  const { userNickname, userAvatar, userCID } = useCIDContext();

  const user = {
    nickname: userNickname || 'Locksy_User',
    verified: true,
    // Per CID Architecture: CID is NEVER exposed in the UI — hidden from all
    cid: 'CID: Hidden from all',
    avatar: userAvatar,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity 
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 60, height: 60, borderRadius: 30 }} />
            ) : (
              <Text style={styles.avatarText}>{user.nickname[0]?.toUpperCase() || '?'}</Text>
            )}
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-circle" size={12} color={COLORS.white} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <View>
              <Text style={styles.profileName}>{user.nickname}</Text>
              <Text style={styles.profileCid}>{user.cid}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileEdit}
              onPress={() => navigation.navigate('EditNickname')}
            >
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('EditNickname')}
          >
            <View style={[styles.icon, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="account-circle" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Edit Nickname</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('EditNickname')}
          >
            <View style={[styles.icon, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="image-plus" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Edit Profile & Photo</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={[styles.icon, { backgroundColor: COLORS.warning + '15' }]}>
              <MaterialCommunityIcons name="lock-reset" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.settingLabel}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('BiometricSetup')}
          >
            <View style={[styles.icon, { backgroundColor: COLORS.success + '15' }]}>
              <MaterialCommunityIcons name="fingerprint" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.settingLabel}>Biometric Lock</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('SecurityCenter')}
          >
            <View style={[styles.icon, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Security Center</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => {
              // Verify CID integrity: re-decrypt and check SHA-256 hash
              Alert.alert(
                '🔍 CID Integrity Check',
                'To verify your CID integrity, unlock the app with your master password. The SHA-256 hash will be re-verified.',
                [{ text: 'OK' }]
              );
            }}
          >
            <View style={[styles.icon, { backgroundColor: COLORS.success + '15' }]}>
              <MaterialCommunityIcons name="shield-key" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.settingLabel}>Verify CID Integrity</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY</Text>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('PresenceVisibility')}
          >
            <View style={[styles.icon, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="eye-off" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Presence & Visibility</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={[styles.icon, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="eye-off" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>Stealth Mode</Text>
            <Switch
              value={stealthMode}
              onValueChange={setStealthMode}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary + '40' }}
              thumbColor={stealthMode ? COLORS.primary : COLORS.gray300}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('NotificationsSettings')}
          >
            <View style={[styles.icon, { backgroundColor: COLORS.warning + '15' }]}>
              <MaterialCommunityIcons name="bell" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.settingLabel}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>

          <View style={styles.settingRow}>
            <View style={[styles.icon, { backgroundColor: COLORS.gray100 }]}>
              <MaterialCommunityIcons name="information" size={20} color={COLORS.textMuted} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.versionText}>2.1.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => Alert.alert('Logout', 'Are you sure?')}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
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
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    position: 'relative',
  },
  avatarText: {
    fontSize: 24,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  profileCid: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  profileEdit: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
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
    flex: 1,
  },
  versionText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.sm,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  bottomSpace: {
    height: SPACING.xl,
  },
});
