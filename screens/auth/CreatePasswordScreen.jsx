/**
 * CreatePasswordScreen.jsx — Password Creation/Reset
 *
 * Used in two scenarios:
 * 1. User forgot password after getting into WrongPasswordScreen
 * 2. User chooses to reset identity after nuking data
 *
 * Flow: User creates new password → Generates new CID → Encrypts and saves
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useCIDContext } from "../../context/CIDContext";
import { COLORS, SPACING, RADIUS } from "../../onboardings/theme";

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: "", color: COLORS.border };
  let score = 0;
  const hasLength = password.length >= 8;
  const hasLetterNum = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (hasLength) score++;
  if (hasLetterNum) score++;
  if (hasSpecial) score++;
  if (score === 1)
    return {
      level: 1,
      label: "WEAK",
      color: "#EF4444",
      hasLength,
      hasLetterNum,
      hasSpecial,
    };
  if (score === 2)
    return {
      level: 2,
      label: "FAIR",
      color: "#F59E0B",
      hasLength,
      hasLetterNum,
      hasSpecial,
    };
  return {
    level: 3,
    label: "STRONG",
    color: "#16A34A",
    hasLength,
    hasLetterNum,
    hasSpecial,
  };
}

export default function CreatePasswordScreen({ navigation }) {
  const { initializeCID } = useCIDContext();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const barWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const targetWidth = (strength.level / 3) * 100;
    Animated.timing(barWidth, {
      toValue: targetWidth,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [strength.level]);

  const handleResetAndCreate = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Required", "Please fill in both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    if (strength.level < 2) {
      Alert.alert("Weak Password", "Please create a stronger password.");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      console.log("[CreatePasswordScreen] Starting password reset...");
      // Generate new CID and encrypt with new password
      await initializeCID(password, null);
      console.log(
        "[CreatePasswordScreen] Reset complete, navigating to setup.",
      );
      navigation.navigate("SetupNickname");
    } catch (error) {
      console.error("[CreatePasswordScreen] Reset failed:", error);
      Alert.alert(
        "Reset Error",
        "Could not reset your password. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.stepLabel}>SECURITY RESET</Text>
          <Text style={styles.title}>Create a{"\n"}new password</Text>
          <Text style={styles.subtitle}>
            This will generate a new identity{"\n"}and wipe your previous data.
          </Text>

          <View style={styles.divider} />

          {/* Password Field */}
          <Text style={styles.fieldLabel}>New Password</Text>
          <View
            style={[styles.inputBox, passwordFocused && styles.inputBoxFocused]}
          >
            <Text style={styles.inputEmoji}>🗝️</Text>
            <TextInput
              style={styles.hiddenInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.textMuted}
              maxLength={32}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeEmoji}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Field */}
          <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
            Confirm
          </Text>
          <View
            style={[
              styles.inputBox,
              confirmFocused && styles.inputBoxFocused,
              confirmPassword &&
                password !== confirmPassword &&
                styles.inputBoxError,
            ]}
          >
            <Text style={styles.inputEmoji}>🔒</Text>
            <TextInput
              style={styles.hiddenInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Confirm password"
              placeholderTextColor={COLORS.textMuted}
              maxLength={32}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeEmoji}>{showConfirm ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {/* Strength Bar */}
          {password.length > 0 && (
            <View style={styles.strengthSection}>
              <View style={styles.strengthHeaderRow}>
                <Text style={styles.strengthLabel}>Strength</Text>
                <Text style={[styles.strengthValue, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
              <View style={styles.strengthTrack}>
                <Animated.View
                  style={[
                    styles.strengthBar,
                    {
                      width: barWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                      }),
                      backgroundColor: strength.color,
                    },
                  ]}
                />
              </View>

              <View style={styles.criteriaList}>
                <CriteriaRow met={strength.hasLength} label="8+ characters" />
                <CriteriaRow
                  met={strength.hasLetterNum}
                  label="Letters + numbers"
                />
                <CriteriaRow
                  met={strength.hasSpecial}
                  label="Special characters"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Reset Button */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              (!password || !confirmPassword || isLoading) &&
                styles.ctaBtnDisabled,
            ]}
            onPress={handleResetAndCreate}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <ActivityIndicator color={COLORS.white} size="small" />
                <Text style={styles.ctaText}>Resetting...</Text>
              </View>
            ) : (
              <Text style={styles.ctaText}>Reset Identity</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function CriteriaRow({ met, label }) {
  return (
    <View style={styles.criteriaRow}>
      <Text style={[styles.criteriaCheck, met && styles.criteriaCheckMet]}>
        {met ? "✓" : "○"}
      </Text>
      <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 120,
  },
  backBtn: {
    marginBottom: SPACING.lg,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.textPrimary,
    lineHeight: 38,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  inputBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0F7FF",
  },
  inputBoxError: {
    borderColor: "#EF4444",
  },
  inputEmoji: {
    fontSize: 18,
    marginRight: SPACING.md,
  },
  hiddenInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    padding: 0,
  },
  eyeBtn: {
    padding: SPACING.sm,
  },
  eyeEmoji: {
    fontSize: 18,
  },
  strengthSection: {
    marginTop: SPACING.lg,
  },
  strengthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  strengthTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SPACING.md,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
    borderRadius: 2,
  },
  criteriaList: {
    gap: SPACING.sm,
  },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  criteriaCheck: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    width: 16,
  },
  criteriaCheckMet: {
    color: "#16A34A",
  },
  criteriaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  criteriaTextMet: {
    color: "#16A34A",
  },
  bottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? SPACING.xl : SPACING.lg,
    backgroundColor: COLORS.white,
  },
  ctaBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
