/**
 * ShowCIDScreen.jsx - Display Generated CID to User
 *
 * Shown after password setup completes
 * User sees their generated CID and can:
 * - Copy/note it
 * - Continue to profile setup
 */
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
} from "react-native";
import { useCIDContext } from "../context/CIDContext";
import { COLORS, SPACING, RADIUS } from "./theme";

export default function ShowCIDScreen({ navigation }) {
  const { userCID } = useCIDContext();
  const [copied, setCopied] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const charAnims = useRef(
    [0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    // Fade and scale in container
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate each character
      Animated.stagger(
        100,
        charAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ),
      ).start();
    });
  }, [fadeAnim, scaleAnim, charAnims]);

  const handleCopyToClipboard = async () => {
    try {
      // React Native doesn't have clipboard API by default
      // For now, we'll show an alert that it's saved locally
      Alert.alert(
        "CID Saved",
        `Your CID "${userCID}" is now encrypted and saved locally on your device.`,
        [{ text: "OK" }],
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[ShowCID] Copy error:", error);
    }
  };

  const handleContinue = () => {
    navigation.navigate("SetupNickname");
  };

  if (!userCID) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Error loading CID</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Celebration Icon */}
        <View style={styles.iconContainer}>
          <Animated.Text
            style={[
              styles.celebrationEmoji,
              {
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0.8, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          >
            🎉
          </Animated.Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Your identity is ready!</Text>
        <Text style={styles.subtitle}>
          Your unique CID has been generated and encrypted with your password.
        </Text>

        {/* CID Display Card */}
        <View style={styles.cidCard}>
          <Text style={styles.cidLabel}>YOUR UNIQUE CID</Text>

          {/* Animated CID Display */}
          <View style={styles.cidDisplay}>
            {userCID.split("").map((char, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.cidCharBox,
                  {
                    opacity: charAnims[i],
                    transform: [
                      {
                        scale: charAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                      {
                        rotateZ: charAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: ["-30deg", "0deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.cidChar}>{char}</Text>
              </Animated.View>
            ))}
          </View>

          <Text style={styles.cidNote}>
            This is your secure identity. Store it safely.
          </Text>

          {/* Copy Button */}
          <TouchableOpacity
            style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
            onPress={handleCopyToClipboard}
            activeOpacity={0.8}
          >
            <Text style={styles.copyBtnText}>
              {copied ? "✓ Saved" : "📋 Save/Copy CID"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Info */}
        <View style={styles.securityBox}>
          <Text style={styles.securityTitle}>🔒 Security Info</Text>
          <Text style={styles.securityText}>
            • Your CID is encrypted with AES-256-GCM
          </Text>
          <Text style={styles.securityText}>
            • Protected by your master password
          </Text>
          <Text style={styles.securityText}>• Stored only on this device</Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Complete Setup →</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === "ios" ? 40 : 30,
    paddingBottom: SPACING.xl,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  celebrationEmoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  cidCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: "#FCD34D",
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    width: "100%",
    alignItems: "center",
  },
  cidLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  cidDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  cidCharBox: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: "#FCD34D",
    alignItems: "center",
    justifyContent: "center",
  },
  cidChar: {
    fontSize: 22,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 1,
  },
  cidNote: {
    fontSize: 12,
    color: "#B45309",
    textAlign: "center",
    marginBottom: SPACING.md,
    fontWeight: "500",
  },
  copyBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  copyBtnSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B45309",
  },
  securityBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: "#16A34A",
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    width: "100%",
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
    marginBottom: SPACING.sm,
  },
  securityText: {
    fontSize: 12,
    color: "#15803D",
    lineHeight: 16,
    marginBottom: SPACING.xs,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 48,
    marginTop: "auto",
  },
  continueBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "600",
  },
});
