import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

/**
 * FileExpiryWarningModal - Screen 52
 * Shows warning when file is about to expire
 * User can open file or let it auto-delete
 */
export default function FileExpiryWarningModal({ 
  visible, 
  onClose, 
  file = {
    name: 'img_secure_01',
    daysLeft: 12,
    size: '2.4 MB',
    encrypted: true
  },
  onOpenFile,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={onClose}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <View style={styles.badges}>
              <View style={styles.daysBadge}>
                <Ionicons name="time" size={12} color={COLORS.white} />
                <Text style={styles.daysBadgeText}>{file.daysLeft} days</Text>
              </View>
              {file.encrypted && (
                <View style={styles.encryptedBadge}>
                  <Ionicons name="lock-closed" size={12} color={COLORS.white} />
                </View>
              )}
            </View>
          </View>

          {/* File Preview */}
          <View style={styles.previewContainer} />;

          {/* Expiry Message */}
          <Text style={styles.expiryTitle}>File expires tomorrow</Text>
          <Text style={styles.expirySubtext}>
            ops_report.pdf will be{'\n'}permanently deleted in 1 day.
          </Text>

          {/* Warning Box */}
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
            <Text style={styles.warningText}>
              Vault files deleted after 15 days. Cannot be undone.
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity 
            style={styles.openButton}
            onPress={() => {
              onOpenFile?.();
              onClose();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.openButtonText}>Open File</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  daysBadgeText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '600',
  },
  encryptedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#D3D3D3',
    marginVertical: SPACING.lg,
  },
  expiryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  expirySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500',
    flex: 1,
  },
  openButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  openButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
});
