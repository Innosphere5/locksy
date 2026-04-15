/**
 * CIDGenerationScreen.jsx - Generate & Display User's Unique CID
 *
 * This screen:
 * 1. Generates a cryptographically unique CID (6 alphanumeric chars: A-Z, 0-9)
 * 2. Displays it with animation
 * 3. Saves it to CIDContext (RAM)
 * 4. Allows user to continue to password setup
 * 5. CID is encrypted and stored securely in Expo SecureStore
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
} from "react-native";
import { useCIDContext } from "../context/CIDContext";
import { generateCID } from "../utils/cryptoEngine";
import { COLORS, SPACING, RADIUS } from "./theme";

export default function CIDGenerationScreen({ navigation }) {
  const { setUserCID } = useCIDContext();
  const [generatedCID, setGeneratedCID] = useState("");
  const [isReady, setIsReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  // Create animation for each character in the CID (generateCID returns 6 alphanumeric chars)
  const charAnimsRef = useRef([]);
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Generate CID
    console.log("[CIDGeneration] Generating CID...");
    const cid = generateCID();
    console.log("[CIDGeneration] Generated CID:", cid);

    setGeneratedCID(cid);
    setUserCID(cid); // Save to context

    // Initialize animation array dynamically based on CID length
    charAnimsRef.current = cid.split("").map(() => new Animated.Value(0));

    // Fade in and slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate each character
      Animated.stagger(
        80,
        charAnimsRef.current.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ),
      ).start(() => {
        // Show success after animation
        setTimeout(() => {
          Animated.timing(successAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
          setIsReady(true);
        }, 300);
      });
    });
  }, [setUserCID]);

  const handleContinue = () => {
    navigation.navigate("SetupMasterPassword");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.lockEmoji}>🔐</Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Your unique identity{"\n"}is ready</Text>
        <Text style={styles.subtitle}>
          This CID is your secure identity. Save it safely.
        </Text>

        {/* CID Display Card */}
        <View style={styles.cidCard}>
          <Text style={styles.cidLabel}>YOUR IDENTITY</Text>

          {/* Animated CID Display */}
          <View style={styles.cidDisplay}>
            {generatedCID.split("").map((char, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.cidCharBox,
                  {
                    opacity: charAnimsRef.current[i] || new Animated.Value(0),
                    transform: [
                      {
                        scale: (charAnimsRef.current[i] || new Animated.Value(0)).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
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

          <Text style={styles.cidDescription}>
            Cryptographically unique · 6 characters
          </Text>

          {/* Copy Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoEmoji}>💾</Text>
            <Text style={styles.infoText}>
              This CID is saved locally. Nobody else has this exact CID.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🔒</Text>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Encrypted</Text>
              <Text style={styles.featureDesc}>Protected by your password</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📱</Text>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Local</Text>
              <Text style={styles.featureDesc}>Never leaves your device</Text>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <Animated.View style={[styles.buttonArea, { opacity: successAnim }]}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={!isReady}
          >
            <Text style={styles.continueBtnText}>Next: Create Password →</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            You'll encrypt this CID with a master password
          </Text>
        </Animated.View>
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
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: SPACING.xl,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  lockEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  cidCard: {
    backgroundColor: "#F0F7FF",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    width: "100%",
  },
  cidLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    textAlign: "center",
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
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cidChar: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  cidDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.md,
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  infoEmoji: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  featuresSection: {
    width: "100%",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  featureEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  buttonArea: {
    width: "100%",
    marginTop: "auto",
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    minHeight: 48,
  },
  continueBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
});
