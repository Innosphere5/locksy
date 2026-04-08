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
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

/**
 * PresenceVisibilityScreen - Screen 60
 * Control online status and last seen visibility
 */
export default function PresenceVisibilityScreen({ navigation }) {
  const [invisibleToEveryone, setInvisibleToEveryone] = useState(false);
  const [lastSeenHidden, setLastSeenHidden] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState('everyone');

  const visibilityOptions = [
    { id: 'everyone', label: 'Everyone', description: 'All contacts see your status' },
    { id: 'myContacts', label: 'My Contacts Only', description: 'Only saved contacts see status' },
    { id: 'nobody', label: 'Nobody', description: 'Online status hidden from all', icon: '●' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Presence & Visibility</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online now</Text>
          </View>
          <Text style={styles.statusDescription}>Last seen visible to contacts</Text>
        </View>

        {/* Stealth Mode Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STEALTH MODE</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.icon, { backgroundColor: COLORS.primary + '15' }]}>
                <MaterialCommunityIcons name="eye-off" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Invisible to everyone</Text>
                <Text style={styles.settingDescription}>Online status hidden · Last seen hidden</Text>
              </View>
            </View>
            <Switch
              value={invisibleToEveryone}
              onValueChange={setInvisibleToEveryone}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary + '40' }}
              thumbColor={invisibleToEveryone ? COLORS.primary : COLORS.gray300}
            />
          </View>
        </View>

        {/* Last Seen Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LAST SEEN VISIBLE TO</Text>
          
          {visibilityOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionRow}
              onPress={() => setSelectedVisibility(option.id)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={[
                styles.radio,
                selectedVisibility === option.id && styles.radioSelected
              ]}>
                {selectedVisibility === option.id && (
                  <View style={styles.radioDot} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Last Seen Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HIDE LAST SEEN</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={[styles.icon, { backgroundColor: COLORS.warning + '15' }]}>
                <MaterialCommunityIcons name="eye-off-outline" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.settingLabel}>Last seen after 1 minute</Text>
            </View>
            <Switch
              value={lastSeenHidden}
              onValueChange={setLastSeenHidden}
              trackColor={{ false: COLORS.gray200, true: COLORS.warning + '40' }}
              thumbColor={lastSeenHidden ? COLORS.warning : COLORS.gray300}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Changes apply immediately to all contacts.
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
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.online,
    marginRight: SPACING.sm,
  },
  statusText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  statusDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
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
    ...SHADOWS.sm,
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
  optionRow: {
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
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray300,
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    alignSelf: 'center',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  infoText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.encryptionText,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});
