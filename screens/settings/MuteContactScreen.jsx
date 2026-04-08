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
 * MuteContactScreen - Screen 65
 * Mute contact notifications for specified duration
 */
export default function MuteContactScreen({ navigation, route }) {
  const contact = route?.params?.contact || {
    name: 'Ghost_Fox',
    avatar: '👻',
  };

  const [selectedDuration, setSelectedDuration] = useState('1h');

  const muteDurations = [
    { id: '1h', label: 'For 1 hour', value: '1 hour' },
    { id: '8h', label: 'For 8 hours', value: '8 hours' },
    { id: '1w', label: 'For 1 week', value: '1 week' },
    { id: 'always', label: 'Always', value: 'forever', warning: true },
  ];

  const handleMute = () => {
    const duration = muteDurations.find(d => d.id === selectedDuration)?.value;
    Alert.alert('Muted', `Notifications muted ${duration}`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mute Contact</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Info */}
        <View style={styles.contactCard}>
          <View style={styles.contactAvatar}>
            <Text style={styles.avatarText}>{contact.avatar}</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Mute {contact.name}</Text>
            <Text style={styles.contactSubtitle}>You'll still receive messages, not notified</Text>
          </View>
        </View>

        {/* Mute Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DURATION</Text>

          {muteDurations.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.durationOption,
                selectedDuration === option.id && styles.durationOptionSelected,
                option.warning && styles.durationOptionWarning
              ]}
              onPress={() => setSelectedDuration(option.id)}
            >
              <View style={styles.durationContent}>
                <Text style={[
                  styles.durationLabel,
                  selectedDuration === option.id && styles.durationLabelSelected,
                  option.warning && styles.durationLabelWarning
                ]}>
                  {option.label}
                </Text>
                {option.warning && (
                  <Text style={styles.durationWarning}>⚠️ Will miss notifications</Text>
                )}
              </View>
              <View style={[
                styles.radio,
                selectedDuration === option.id && styles.radioSelected
              ]}>
                {selectedDuration === option.id && (
                  <View style={styles.radioDot} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="bell-off" size={16} color={COLORS.warning} />
          <Text style={styles.infoText}>
            You'll still receive messages, but won't get notified.
          </Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.muteButton}
          onPress={handleMute}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="bell-off" size={20} color={COLORS.white} />
          <Text style={styles.muteButtonText}>Mute for 1 hour</Text>
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  contactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  avatarText: {
    fontSize: 28,
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
  contactSubtitle: {
    ...TYPOGRAPHY.body3,
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
  durationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  durationOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  durationOptionWarning: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  durationContent: {
    flex: 1,
  },
  durationLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  durationLabelSelected: {
    color: COLORS.primary,
  },
  durationLabelWarning: {
    color: COLORS.warning,
  },
  durationWarning: {
    ...TYPOGRAPHY.body3,
    color: COLORS.warning,
    marginTop: SPACING.xs,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    marginLeft: SPACING.md,
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    alignSelf: 'center',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  muteButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  muteButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
});
