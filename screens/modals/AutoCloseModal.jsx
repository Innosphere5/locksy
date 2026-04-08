import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme/colors';

export default function AutoCloseModal({ visible, onClose, onConfirm }) {
  const [selectedOption, setSelectedOption] = useState('immediately');

  const options = [
    {
      id: 'immediately',
      icon: '⚡',
      label: 'Immediately',
      time: 0,
    },
    {
      id: '1min',
      icon: '⏱️',
      label: 'After 1 minute',
      time: 60,
    },
    {
      id: '5min',
      icon: '⏱️',
      label: 'After 5 minutes',
      time: 300,
    },
    {
      id: '1hour',
      icon: '⏱️',
      label: 'After 1 hour',
      time: 3600,
    },
  ];

  const handleConfirm = () => {
    const selectedOpt = options.find(o => o.id === selectedOption);
    onConfirm({
      id: selectedOption,
      label: selectedOpt.label,
      time: selectedOpt.time,
    });
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
      hardwareAccelerated={true}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <Text style={styles.headerLabel}>25 · CHAT AUTO-CLOSE</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overlay Background */}
        <View style={styles.overlay} />

        {/* Modal Content */}
        <View style={styles.container}>
          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🔐</Text>
            <Text style={styles.headerTitle}>Auto-Close Chat</Text>
            <Text style={styles.headerDesc}>
              Chat locks · password required to reopen
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  selectedOption === option.id && styles.optionSelected,
                ]}
                onPress={() => setSelectedOption(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionRadio}>
                  {selectedOption === option.id && (
                    <View style={styles.radioFilled} />
                  )}
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionTextRow}>
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  headerSection: {
    backgroundColor: COLORS.gray100,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnIcon: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  headerIcon: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  headerDesc: {
    fontSize: 13,
    color: COLORS.gray500,
    textAlign: 'center',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    gap: SPACING.md,
  },
  optionSelected: {
    backgroundColor: '#EBF5FF',
    borderColor: COLORS.primary,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  optionIcon: {
    fontSize: 18,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  optionDesc: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  cancelBtn: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
});
