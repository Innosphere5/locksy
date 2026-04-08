import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width: screenWidth } = Dimensions.get('screen');

/**
 * VaultEmptyScreen - Screen 51
 * Empty state for Vault with prompt to add first item
 */
export default function VaultEmptyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vault</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="lock" size={80} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Vault is empty</Text>
        <Text style={styles.description}>
          Save photos, videos, files.{'\n'}Auto-deleted after 15 days.
        </Text>

        {/* Encryption Badge */}
        <View style={styles.encryptionBadge}>
          <MaterialCommunityIcons name="lock-check" size={16} color={COLORS.encryptionText} />
          <Text style={styles.encryptionBadgeText}>All content is AES-256 encrypted</Text>
        </View>

        {/* Add to Vault Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Add', 'Select media to add to vault')}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>Add to Vault</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  iconWrapper: {
    marginBottom: SPACING.xxl,
  },
  dashedBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#F0F4FF',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xxl,
    gap: SPACING.xs,
  },
  encryptionText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: COLORS.background,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.tabInactive,
    fontWeight: '500',
  },
});
