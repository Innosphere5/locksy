// screens/auth/AccessDeniedScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { nukeAllData } from "../../utils/secureStorage";

/**
 * AccessDeniedScreen — CID Architecture Implementation
 *
 * Triggered after 3 wrong password attempts.
 * Calls nukeAllData() on mount to ACTUALLY destroy all encrypted storage.
 *
 * Per design: "3 Wrong Passwords = ALL DATA DESTROYED — No recovery"
 *
 * Previous implementation only showed an animation — nothing was actually deleted.
 * This version performs the real SecureStore wipe, then navigates to Onboarding.
 */
export default function AccessDeniedScreen({ navigation }) {
  const [percent, setPercent] = useState(0);
  const [wipeStatus, setWipeStatus] = useState("Initializing secure erase...");
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const executeWipe = async () => {
      try {
        // Step 1: Announce wipe start
        if (isMounted) setWipeStatus("Destroying encryption keys...");

        // Step 2: Actually nuke all data from SecureStore
        await nukeAllData();
        if (isMounted) setWipeStatus("Erasing encrypted CID bundle...");

        // Brief pause for UI update
        await new Promise((r) => setTimeout(r, 400));
        if (isMounted) setWipeStatus("Removing integrity hashes...");

        await new Promise((r) => setTimeout(r, 400));
        if (isMounted) setWipeStatus("Clearing all local data...");

        await new Promise((r) => setTimeout(r, 400));
        if (isMounted) setWipeStatus("Complete. All data destroyed.");
      } catch (error) {
        console.error("[AccessDenied] Wipe error:", error);
        // Even on error, try to navigate to onboarding
      }
    };

    // Run data wipe immediately on mount
    executeWipe();

    // Animate progress bar from 0% to 100% over 4 seconds
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 4000,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    const listener = progress.addListener(({ value }) => {
      if (isMounted) setPercent(Math.round(value * 100));
    });

    anim.start(({ finished }) => {
      if (finished && isMounted) {
        // Navigate to CreatePassword after wipe animation completes
        // User can reset and create new identity
        setTimeout(() => {
          if (isMounted) navigation.replace("CreatePassword");
        }, 800);
      }
    });

    return () => {
      isMounted = false;
      progress.removeListener(listener);
      anim.stop();
    };
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🔐</Text>
          </View>
        </View>

        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.subtitle}>
          3 incorrect attempts.{"\n"}Securely erasing all data.
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>

        <Text style={styles.percentText}>WIPING... {percent}%</Text>

        {/* Status message */}
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{wipeStatus}</Text>
        </View>

        <Text style={styles.detailText}>
          All messages, contacts, vault{"\n"}and encryption keys are being
          erased.
        </Text>

        {/* Architecture note */}
        <View style={styles.archNote}>
          <Text style={styles.archNoteText}>
            🛡️ Zero Server Trust · Local-only storage{"\n"}
            No cloud backup · No recovery possible
          </Text>
        </View>

        {/* Footer watermark */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LOCKSY · SECURE ERASE · AES-256-GCM
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  iconWrap: { marginBottom: 28 },
  iconBox: {
    width: 90,
    height: 90,
    backgroundColor: "#FEF2F2",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 40 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#DC2626",
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#EF4444",
    borderRadius: 4,
  },
  percentText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
    width: "100%",
  },
  statusText: {
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
    fontWeight: "500",
  },
  detailText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  archNote: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  archNoteText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 32,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#CBD5E1",
    letterSpacing: 2,
  },
});
