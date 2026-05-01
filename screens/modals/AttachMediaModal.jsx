import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme/colors';

export default function AttachMediaModal({ 
  visible, 
  onClose,
  onSelectMedia,
}) {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isViewOnce, setIsViewOnce] = useState(false);

  const mediaOptions = [
    { 
      id: 'photo', 
      icon: '📷', 
      label: 'PHOTO',
      type: 'image',
      color: COLORS.avatar.blue,
      description: 'Photo from gallery'
    },
    { 
      id: 'video', 
      icon: '🎥', 
      label: 'VIDEO',
      type: 'video',
      color: COLORS.avatar.purple,
      description: 'Video from gallery'
    },
    { 
      id: 'voice', 
      icon: '🎤', 
      label: 'VOICE',
      type: 'voice',
      color: COLORS.avatar.green,
      description: 'Record voice message'
    },
    { 
      id: 'file', 
      icon: '📄', 
      label: 'FILE', 
      type: 'file', 
      color: COLORS.avatar.cyan,
      description: 'Document or file'
    },
    { 
      id: 'timer', 
      icon: '⏱️', 
      label: 'TIMER', 
      type: 'timer', 
      color: COLORS.warningLight,
      description: 'Auto-delete timer'
    },
  ];

  const handleMediaSelect = (option) => {
    setSelectedMedia(option.id);
    if (onSelectMedia) {
      onSelectMedia({
        type: option.type,
        id: option.id,
        label: option.label,
        isViewOnce: (option.type === 'image' || option.type === 'video' || option.type === 'file' || option.type === 'voice') ? isViewOnce : false,
      });
    }
    // Auto-close after selection
    setTimeout(() => {
      onClose();
      // Reset toggle for next time
      setIsViewOnce(false);
    }, 300);
  };

  const renderMediaOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.mediaOption,
        { backgroundColor: option.color },
        selectedMedia === option.id && styles.mediaOptionSelected,
      ]}
      onPress={() => handleMediaSelect(option)}
      activeOpacity={0.8}
    >
      <Text style={styles.mediaIcon}>{option.icon}</Text>
      <Text style={styles.mediaLabel}>{option.label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
      hardwareAccelerated={true}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.gray100} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>26 · ATTACH MEDIA</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Overlay Background */}
        <ScrollView style={styles.overlay} scrollEnabled={false}>
          <View style={{ flex: 1 }} />
        </ScrollView>

        {/* Media Container */}
        <View style={styles.mediaContainer}>
          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleIcon}>📎</Text>
            <Text style={styles.titleText}>Send Encrypted</Text>
            <Text style={styles.titleDesc}>AES-256 before sending · All types</Text>
          </View>

          {/* View Once Toggle Section */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleIcon}>👁️</Text>
              <View>
                <Text style={styles.toggleTitle}>View Once Mode</Text>
                <Text style={styles.toggleSubtitle}>Media disappears after opening</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.toggleSwitch, 
                isViewOnce && styles.toggleSwitchActive
              ]}
              onPress={() => setIsViewOnce(!isViewOnce)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.toggleKnob,
                isViewOnce && styles.toggleKnobActive
              ]} />
            </TouchableOpacity>
          </View>

          {/* Media Grid */}
          <View style={styles.mediaGrid}>
            {mediaOptions.map((option) => renderMediaOption(option))}
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={styles.infoText}>
              All media is encrypted with AES-256 before transmission
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
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
  mediaContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  titleIcon: {
    fontSize: 28,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  titleDesc: {
    fontSize: 12,
    color: COLORS.gray500,
    textAlign: 'center',
    fontWeight: '500',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  mediaOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mediaOptionSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowOpacity: 0.25,
    elevation: 4,
  },
  mediaIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  mediaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.encryptionBorder,
    marginTop: SPACING.md,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.encryptionText,
    fontWeight: '500',
    lineHeight: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  toggleIcon: {
    fontSize: 24,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gray300,
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
});
