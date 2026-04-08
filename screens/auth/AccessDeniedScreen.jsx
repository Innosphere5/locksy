import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';

export default function AccessDeniedScreen({ navigation }) {
  const [percent, setPercent] = useState(60);
  const progress = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Animate wipe from 60% to 100%
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 4000,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    const listener = progress.addListener(({ value }) => {
      setPercent(Math.round(value * 100));
    });

    anim.start(({ finished }) => {
      if (finished) {
        // After wipe complete, navigate to onboarding/splash
        setTimeout(() => navigation.replace('Splash'), 600);
      }
    });

    return () => {
      progress.removeListener(listener);
      anim.stop();
    };
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
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
          3 incorrect attempts.{'\n'}Securely erasing all data.
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>

        <Text style={styles.percentText}>WIPING... {percent}%</Text>

        <Text style={styles.detailText}>
          All messages, contacts, vault{'\n'}and keys are being erased.
        </Text>

        {/* Footer watermark */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>LOCKSY · SECURE ERASE</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  iconWrap: { marginBottom: 28 },
  iconBox: {
    width: 90,
    height: 90,
    backgroundColor: '#FEF2F2',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 40 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1.5,
    marginBottom: 32,
  },
  detailText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: 2,
  },
});