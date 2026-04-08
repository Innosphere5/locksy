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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

/**
 * ContactInfoScreen - Screen 63
 * Show detailed contact information and verification status
 */
export default function ContactInfoScreen({ navigation, route }) {
  const contact = route?.params?.contact || {
    name: 'Ghost_Fox',
    nickname: 'Ghost_Fox',
    cid: 'A7F3K9',
    avatar: '👻',
    onlineStatus: true,
    verified: true,
    fingerprints: ['A3F9', '28BC', '7D4E', 'F1C6'],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Info</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>{contact.avatar}</Text>
            {contact.onlineStatus && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          <Text style={styles.profileName}>{contact.name}</Text>
          <Text style={styles.profileStatus}>
            {contact.onlineStatus ? '● Online now' : '● Offline'}
          </Text>
        </View>

        {/* Contact Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="message" size={24} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="phone" size={24} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="video" size={24} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Video</Text>
          </TouchableOpacity>
        </View>

        {/* CID Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT ID</Text>
          <View style={styles.cidCard}>
            <Text style={styles.cidLabel}>{contact.cid}</Text>
            <TouchableOpacity style={styles.cidCopyBtn}>
              <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
              <Text style={styles.cidCopyText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VERIFY ENCRYPTION</Text>
          
          <TouchableOpacity style={styles.verifyCard}>
            <View style={styles.verifyContent}>
              <MaterialCommunityIcons name="check-all" size={24} color={COLORS.success} />
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.verifyStatus}>Your fingerprints match</Text>
                <Text style={styles.verifyDescription}>No interception · Secure</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Fingerprints */}
        <View style={styles.section}>
          <View style={styles.fingerprintHeader}>
            <Text style={styles.sectionTitle}>{contact.name.toUpperCase()}'S FINGERPRINT</Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.fingerprintGrid}>
            {contact.fingerprints.map((fp, idx) => (
              <View key={idx} style={styles.fingerprintItem}>
                <Text style={styles.fingerprintValue}>{fp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Your Fingerprints */}
        <View style={styles.section}>
          <View style={styles.fingerprintHeader}>
            <Text style={styles.sectionTitle}>YOUR FINGERPRINT</Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.fingerprintGrid}>
            {['A3F9', '28BC', '7D4E', 'F1C6'].map((fp, idx) => (
              <View key={idx} style={styles.fingerprintItem}>
                <Text style={styles.fingerprintValue}>{fp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionRow}>
            <View style={[styles.actionRowIcon, { backgroundColor: COLORS.error + '15' }]}>
              <MaterialCommunityIcons name="block-helper" size={20} color={COLORS.error} />
            </View>
            <Text style={styles.actionRowLabel}>Block Contact</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
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
  moreBtn: {
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
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  avatarText: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.online,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  profileStatus: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionLabel: {
    ...TYPOGRAPHY.body3,
    color: COLORS.text,
    marginTop: SPACING.sm,
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
  cidCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  cidLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 2,
  },
  cidCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
  },
  cidCopyText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  verifyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  verifyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verifyStatus: {
    ...TYPOGRAPHY.body1,
    color: COLORS.success,
    fontWeight: '600',
  },
  verifyDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  fingerprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fingerprintGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fingerprintItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  fingerprintValue: {
    ...TYPOGRAPHY.body3,
    color: COLORS.text,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  actionRowIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionRowLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
});
