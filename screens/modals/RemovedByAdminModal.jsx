import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';

export default function RemovedByAdminModal({ visible, groupName = 'OP-SECTOR-7', onOk, onDeleteHistory }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onOk}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="ban" size={44} color={COLORS.danger} />
          </View>

          <Text style={styles.title}>You were removed</Text>
          <Text style={styles.subtitle}>
            The admin removed you from {groupName}. You can no longer send or receive messages.
          </Text>

          {/* Key Rotation Notice */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeEmoji}>🔒</Text>
            <Text style={styles.noticeText}>Group encryption keys have been rotated for security.</Text>
          </View>

          {/* OK Button */}
          <TouchableOpacity style={styles.okBtn} onPress={onOk} activeOpacity={0.85}>
            <Text style={styles.okBtnText}>OK, Got it</Text>
          </TouchableOpacity>

          {/* Delete History */}
          <TouchableOpacity style={styles.deleteBtn} onPress={onDeleteHistory} activeOpacity={0.7}>
            <Text style={styles.deleteBtnText}>Delete Chat History</Text>
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
    backgroundColor: COLORS.dangerLight,
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  noticeEmoji: { fontSize: 16 },
  noticeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    flex: 1,
  },
  okBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  okBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  deleteBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },
});