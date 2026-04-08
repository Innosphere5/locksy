// LeaveGroupModal.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';

export default function LeaveGroupModal({ visible, groupName = 'OP-SECTOR-7', onLeave, onCancel }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={{ fontSize: 40 }}>🚪</Text>
          </View>

          <Text style={styles.title}>Leave Group?</Text>
          <Text style={styles.subtitle}>
            Your message history will be deleted from your device. You can only rejoin if the admin adds you back.
          </Text>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={14} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.warningText}>Local chat history permanently deleted.</Text>
          </View>

          {/* Leave Button */}
          <TouchableOpacity style={styles.leaveBtn} onPress={onLeave} activeOpacity={0.85}>
            <Text style={styles.leaveBtnText}>Leave Group</Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  sheet: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  warningText: {
    fontSize: 13,
    color: COLORS.danger,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    flex: 1,
  },
  leaveBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  leaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },
});