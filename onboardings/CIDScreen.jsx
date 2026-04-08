// onboardings/CIDScreen.jsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from './theme';

const { height } = Dimensions.get('window');

const CID_CHARS = ['A', '7', 'F', '3', 'K', '9'];

export default function CIDScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const charAnims = CID_CHARS.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      Animated.stagger(
        80,
        charAnims.map((anim) =>
          Animated.spring(anim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true })
        )
      ).start();
    });
  }, []);

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Dots */}
      <View style={styles.dotsRow}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>

      {/* Icon */}
      <View style={styles.iconSquare}>
        <Text style={styles.idText}>ID</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Your CID is your{'\n'}identity</Text>

      {/* CID Card */}
      <View style={styles.cidCard}>
        <Text style={styles.cidLabel}>EXAMPLE CID</Text>
        <View style={styles.cidCharRow}>
          {CID_CHARS.map((char, i) => (
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
                        outputRange: [0.5, 1],
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
        <Text style={styles.cidHint}>Letters + numbers · 6 characters</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>🙈</Text>
          <Text style={styles.featureText}>Never shown to others in groups</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>📱</Text>
          <Text style={styles.featureText}>Share via QR code or manually</Text>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={() => navigation.navigate('CIDFlow', { isOnboarding: true, onFlowComplete: () => navigation.navigate('SetupMasterPassword') })}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>Generate My CID →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 70 : 55,
    paddingBottom: SPACING.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 22,
  },
  iconSquare: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  idText: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: SPACING.xl,
  },
  cidCard: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primaryGlow,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cidLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2.5,
    marginBottom: SPACING.md,
  },
  cidCharRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  cidCharBox: {
    width: 38,
    height: 46,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cidChar: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cidHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  featuresContainer: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: 'auto',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});