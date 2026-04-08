import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';

const STEPS = [
  { num: 1, label: 'Admin reviews your request' },
  { num: 2, label: 'You get notified if approved' },
  { num: 3, label: 'E2EE keys exchanged' },
];

export default function JoinRequestPendingScreen({ navigation, route }) {
  const groupName = route?.params?.groupName || 'OP-SECTOR-7';

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      `Cancel your join request for ${groupName}?`,
      [
        { text: 'Keep Waiting', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="account-group" size={44} color={COLORS.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Request Sent</Text>
        <Text style={styles.groupName}>{groupName}</Text>
        <Text style={styles.subtitle}>Closed · Admin approval required</Text>

        {/* Status Pill */}
        <View style={styles.statusPill}>
          <Text style={styles.statusEmoji}>⏳</Text>
          <View>
            <Text style={styles.statusLabel}>Waiting for Admin</Text>
            <Text style={styles.statusSub}>You'll be notified when approved</Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, idx) => (
            <View key={step.num} style={styles.stepRow}>
              <View style={styles.stepNumWrapper}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{step.num}</Text>
                </View>
                {idx < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
            </View>
          ))}
        </View>

        {/* Cancel Request */}
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>Cancel Request</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: 48,
    paddingBottom: 32,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginBottom: 24,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.warningLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  statusEmoji: {
    fontSize: 22,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warning,
    fontFamily: FONTS.bold,
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.warning,
    fontFamily: FONTS.regular,
    opacity: 0.8,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    minHeight: 56,
  },
  stepNumWrapper: {
    alignItems: 'center',
    width: 28,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 24,
  },
  stepLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    paddingTop: 5,
    flex: 1,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.danger,
    fontFamily: FONTS.semiBold,
  },
});