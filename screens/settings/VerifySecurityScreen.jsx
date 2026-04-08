import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

/**
 * VerifySecurityScreen - Screen 64
 * Verify fingerprints and encryption status with comparison
 */
export default function VerifySecurityScreen({ navigation, route }) {
  const contact = route?.params?.contact || {
    name: 'Ghost_Fox',
    cid: 'A7F3K9',
    avatar: '👻',
    fingerprints: ['A3F9', '28BC', '7D4E', 'F1C6'],
    verified: true,
  };

  const [comparisonMode, setComparisonMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <MaterialCommunityIcons name="check-circle" size={56} color={COLORS.success} />
          </View>
          <Text style={styles.statusTitle}>Fingerprints match</Text>
          <Text style={styles.statusDescription}>
            No interception · Secure
          </Text>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPARING WITH</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <Text style={styles.avatarText}>{contact.avatar}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactCid}>{contact.cid}</Text>
            </View>
            <TouchableOpacity 
              style={styles.shareBtn}
              onPress={() => Alert.alert('Share', 'Share this fingerprint code')}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Fingerprints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR FINGERPRINT</Text>
          <View style={styles.fingerprintContainer}>
            {['A3F9', '28BC', '7D4E', 'F1C6'].map((fp, idx) => (
              <View key={idx} style={styles.fingerprintCode}>
                <Text style={styles.fingerprintLabel}>YOUR</Text>
                <Text style={styles.fingerprintValue}>{fp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* vs */}
        <View style={styles.vsContainer}>
          <View style={styles.vsLine} />
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.vsLine} />
        </View>

        {/* Contact's Fingerprints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{contact.name.toUpperCase()}'S FINGERPRINT</Text>
          <View style={styles.fingerprintContainer}>
            {contact.fingerprints.map((fp, idx) => (
              <View key={idx} style={styles.fingerprintCode}>
                <Text style={styles.fingerprintLabel}>GHOST_FOX</Text>
                <Text style={styles.fingerprintValue}>{fp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comparison Result */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
            <Text style={styles.resultTitle}>All codes match</Text>
          </View>
          <Text style={styles.resultDescription}>
            Encryption between you and {contact.name} is verified secure. No one can intercept your messages.
          </Text>
        </View>

        {/* How to Verify */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HOW TO VERIFY</Text>
          
          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Compare codes in person</Text>
              <Text style={styles.instructionDescription}>
                Meet in person and compare the fingerprints displayed on both devices.
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Verify via video call</Text>
              <Text style={styles.instructionDescription}>
                Use video call and read codes aloud to each other.
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Share code securely</Text>
              <Text style={styles.instructionDescription}>
                Use trusted channels to share fingerprints with contacts.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.markButton}
          onPress={() => Alert.alert('Verified', 'Contact marked as verified')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
          <Text style={styles.markButtonText}>Mark as Verified ✓</Text>
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
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  statusIcon: {
    marginBottom: SPACING.md,
  },
  statusTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statusDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  contactCid: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fingerprintContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fingerprintCode: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  fingerprintLabel: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  fingerprintValue: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xl,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  vsText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  resultCard: {
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resultTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  resultDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  instructionNumberText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  instructionDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  markButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  markButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
});
