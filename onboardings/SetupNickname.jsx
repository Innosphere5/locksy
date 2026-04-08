// onboardings/SetupNickname.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from './theme';

function generateCID() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function SetupNickname({ navigation }) {
  const [nickname, setNickname] = useState('Phantom_X');
  const [focused, setFocused] = useState(false);
  const [cid] = useState(generateCID);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (!nickname.trim()) {
      Alert.alert('Required', 'Please enter a nickname.');
      return;
    }
    if (nickname.trim().length < 2) {
      Alert.alert('Too Short', 'Nickname must be at least 2 characters.');
      return;
    }
    navigation.navigate('SetupProfilePhoto', { nickname: nickname.trim(), cid });
  };

  const avatarLetter = nickname.trim()[0]?.toUpperCase() || '?';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Step label */}
        <Text style={styles.stepLabel}>STEP 2 OF 3 — IDENTITY</Text>

        <Text style={styles.title}>Choose your nickname</Text>
        <Text style={styles.subtitle}>Visible to contacts · CID stays hidden</Text>

        <View style={styles.divider} />

        {/* Nickname input */}
        <Text style={styles.fieldLabel}>Nickname</Text>
        <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
          <Text style={styles.inputEmoji}>👤</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter nickname"
            placeholderTextColor={COLORS.textMuted}
            maxLength={24}
          />
        </View>

        {/* Identity Preview Card */}
        {nickname.trim().length > 0 && (
          <Animated.View
            style={[
              styles.previewCard,
              { transform: [{ translateY: cardAnim }], opacity: fadeAnim },
            ]}
          >
            <Text style={styles.previewCardLabel}>IDENTITY PREVIEW</Text>
            <View style={styles.previewRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </View>
              <View style={styles.previewTextWrap}>
                <Text style={styles.previewName}>{nickname.trim()}</Text>
                <Text style={styles.previewCid}>CID: auto-generated · never shared</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Info note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoIcon}>🛡️</Text>
          <Text style={styles.infoText}>
            CID is cryptographically unique per device. Only your nickname is visible to others.
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, !nickname.trim() && styles.ctaBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 70 : 55,
    paddingBottom: Platform.OS === 'ios' ? 44 : SPACING.xl,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 38,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  inputBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  inputEmoji: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  previewCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryGlow,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  previewCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  previewTextWrap: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  previewCid: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  infoIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});