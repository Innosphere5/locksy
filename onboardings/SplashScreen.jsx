// onboardings/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { hasCIDBundle } from '../utils/secureStorage';
import { COLORS, SPACING, RADIUS } from './theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const checkAuthStatus = async () => {
      try {
        // Check for encrypted CID bundle (new schema) — not plaintext master_password
        const hasBundle = await hasCIDBundle();
        setTimeout(() => {
          if (hasBundle) {
            navigation.replace('WelcomeBack');
          } else {
            navigation.replace('Onboarding');
          }
        }, 2400);
      } catch (error) {
        console.error('Error checking secure store:', error);
        setTimeout(() => {
          navigation.replace('Onboarding');
        }, 2400);
      }
    };

    checkAuthStatus();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Animated.View
        style={[
          styles.glowCircle,
          { opacity: glowAnim },
        ]}
      />

      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.lockEmoji}>🔐</Text>
          <View style={styles.keyBadge}>
            <Text style={styles.keyEmoji}>🗝️</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>
          <Text style={styles.titleBold}>Lock</Text>
          <Text style={styles.titleRegular}>sy</Text>
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.subtitleWrapper,
          {
            opacity: subtitleAnim,
            transform: [
              {
                translateY: subtitleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.subtitle}>Zero-trust secure messenger</Text>
      </Animated.View>

      {/* Pill indicator */}
      <View style={styles.pillRow}>
        <View style={[styles.pill, styles.pillActive]} />
        <View style={styles.pill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.primaryLight,
    top: height * 0.22,
  },
  logoWrapper: {
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
  },
  lockEmoji: {
    fontSize: 52,
  },
  keyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  keyEmoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 40,
    letterSpacing: -0.5,
    marginTop: SPACING.sm,
  },
  titleBold: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  titleRegular: {
    fontWeight: '400',
    color: COLORS.textPrimary,
  },
  subtitleWrapper: {
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    bottom: height * 0.12,
  },
  pill: {
    width: 28,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    width: 40,
  },
});