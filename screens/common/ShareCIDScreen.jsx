import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Share,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width: screenWidth } = Dimensions.get('screen');

/**
 * ShareCIDScreen - Screen 67
 * Share Contact ID via various channels
 */
export default function ShareCIDScreen({ navigation, route }) {
  const cid = route?.params?.cid || 'A7F3K9';
  const [copied, setCopied] = useState(false);

  const shareChannels = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: 'whatsapp',
      iconColor: COLORS.success,
      bgColor: COLORS.success + '15',
    },
    {
      id: 'email',
      label: 'Email',
      icon: 'email',
      iconColor: COLORS.primary,
      bgColor: COLORS.primary + '15',
    },
    {
      id: 'sms',
      label: 'SMS',
      icon: 'message-text',
      iconColor: COLORS.warning,
      bgColor: COLORS.warning + '15',
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: 'content-copy',
      iconColor: COLORS.primary,
      bgColor: COLORS.primary + '15',
    },
  ];

  const handleShare = (channel) => {
    if (channel === 'copy') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      Alert.alert('Share', `Share via ${channel}`, [
        { text: 'OK', onPress: () => {} },
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      ]);
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
        <Text style={styles.headerTitle}>Share your CID</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CID Display */}
        <View style={styles.cidDisplayCard}>
          <Text style={styles.cidDisplayLabel}>Your CID</Text>
          <Text style={styles.cidDisplayValue}>{cid}</Text>
          <Text style={styles.cidDisplayHint}>Share this code with new contacts</Text>
        </View>

        {/* QR Code Placeholder */}
        <View style={styles.qrSection}>
          <View style={styles.qrPlaceholder}>
            <MaterialCommunityIcons name="qrcode" size={80} color={COLORS.primary} />
          </View>
          <Text style={styles.qrLabel}>Or scan QR code</Text>
        </View>

        {/* Share Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHARE VIA</Text>
          <View style={styles.channelGrid}>
            {shareChannels.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={styles.channelCard}
                onPress={() => handleShare(channel.label.toLowerCase())}
                activeOpacity={0.7}
              >
                <View style={[styles.channelIcon, { backgroundColor: channel.bgColor }]}>
                  <MaterialCommunityIcons 
                    name={channel.icon} 
                    size={32} 
                    color={channel.iconColor} 
                  />
                </View>
                <Text style={styles.channelLabel}>{channel.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Copy Status */}
        {copied && (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
            <Text style={styles.successText}>Copied to clipboard!</Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={16} color={COLORS.primary} />
          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              New contacts can add you using your CID. Once connected, encryption is automatic.
            </Text>
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
  cidDisplayCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  cidDisplayLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SPACING.xs,
  },
  cidDisplayValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    letterSpacing: 4,
    marginBottom: SPACING.md,
    fontFamily: 'monospace',
  },
  cidDisplayHint: {
    ...TYPOGRAPHY.body3,
    color: COLORS.white,
    opacity: 0.7,
  },
  qrSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  qrLabel: {
    ...TYPOGRAPHY.body2,
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
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  channelCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  channelIcon: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  channelLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  successText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  infoTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.encryptionText,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  infoText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.encryptionText,
  },
});
