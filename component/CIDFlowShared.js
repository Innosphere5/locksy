import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { COLORS } from '../theme/colors';  // CORRECT: already in app/component/

// ─── Shared Components ────────────────────────────────────────────────────────

export const StatusBarLight = () => (
  <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
);

export const StatusBarDark = () => (
  <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
);

export const NavBar = ({ title, onBack, rightIcon, dark = false }) => (
  <View
    style={[
      styles.navBar,
      dark && { backgroundColor: COLORS.dark },
    ]}
  >
    {onBack ? (
      <TouchableOpacity
        style={styles.navBack}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Text style={[styles.navBackArrow, dark && { color: COLORS.white }]}>
          ←
        </Text>
      </TouchableOpacity>
    ) : (
      <View style={{ width: 40 }} />
    )}
    <Text style={[styles.navTitle, dark && { color: COLORS.white }]}>
      {title}
    </Text>
    {rightIcon ? (
      <TouchableOpacity style={styles.navRight} activeOpacity={0.7}>
        <Text style={[styles.navRightIcon, dark && { color: COLORS.white }]}>
          {rightIcon}
        </Text>
      </TouchableOpacity>
    ) : (
      <View style={{ width: 40 }} />
    )}
  </View>
);

export const PrimaryButton = ({ label, onPress, style, loading = false }) => (
  <TouchableOpacity
    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled, style]}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={loading}
  >
    <Text style={styles.primaryBtnText}>{label}</Text>
  </TouchableOpacity>
);

export const SecondaryButton = ({ label, onPress, style }) => (
  <TouchableOpacity
    style={[styles.secondaryBtn, style]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.secondaryBtnText}>{label}</Text>
  </TouchableOpacity>
);

export const CIDDisplay = ({
  cid = 'A7F3K9',
  size = 'large',
  color = COLORS.primary,
}) => {
  const chars = cid.split('');
  return (
    <View style={styles.cidRow}>
      {chars.map((ch, i) => (
        <View
          key={i}
          style={[styles.cidPill, size === 'small' && styles.cidPillSm]}
        >
          <Text
            style={[
              styles.cidPillChar,
              size === 'small' && styles.cidPillCharSm,
              { color },
            ]}
          >
            {ch}
          </Text>
        </View>
      ))}
    </View>
  );
};

export const ContactCard = ({
  name,
  cid,
  avatar = '👤',
  verified = false,
  style,
}) => (
  <View style={[styles.contactCard, style]}>
    <View style={styles.contactAvatar}>
      <Text style={{ fontSize: 24 }}>{avatar}</Text>
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.contactName}>{name}</Text>
      <Text style={styles.contactCID}>{cid}</Text>
    </View>
    {verified && (
      <View style={styles.verifiedBadge}>
        <Text style={styles.verifiedText}>✓ Verified</Text>
      </View>
    )}
  </View>
);

export const CheckItem = ({ text, style }) => (
  <View style={[styles.checkRow, style]}>
    <Text style={styles.checkRowIcon}>✓</Text>
    <Text style={styles.checkRowText}>{text}</Text>
  </View>
);

export const InfoRow = ({ icon, text, style }) => (
  <View style={[styles.infoRow, style]}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

export const WarningBox = ({ text, style }) => (
  <View style={[styles.warningBox, style]}>
    <Text style={styles.warningText}>{text}</Text>
  </View>
);

export const HintBox = ({ text, style }) => (
  <View style={[styles.hintBox, style]}>
    <Text style={styles.hintText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navBack: { padding: 4 },
  navBackArrow: { fontSize: 20, color: COLORS.text },
  navTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  navRight: { padding: 4 },
  navRightIcon: { fontSize: 18, color: COLORS.text },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },

  cidRow: { flexDirection: 'row', gap: 8 },
  cidPill: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  cidPillSm: { width: 34, height: 40 },
  cidPillChar: { fontSize: 20, fontWeight: '800' },
  cidPillCharSm: { fontSize: 15 },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  contactCID: {
    fontSize: 13,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: COLORS.successLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  verifiedText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkRowIcon: {
    fontSize: 16,
    color: COLORS.success,
    marginRight: 10,
    fontWeight: '700',
  },
  checkRowText: { fontSize: 14, color: COLORS.textMuted },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    width: '100%',
  },
  infoIcon: { fontSize: 16, marginRight: 12 },
  infoText: { fontSize: 14, color: COLORS.textMuted, flex: 1 },

  warningBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
    textAlign: 'center',
  },

  infoBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoBoxText: {
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 19,
    textAlign: 'center',
  },

  hintBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 19,
  },
});
