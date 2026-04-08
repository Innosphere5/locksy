// onboardings/OnboardingScreen.jsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from './theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: '🔐',
    iconBg: '#FEF3C7',
    title: 'Zero-trust\nMessaging',
    subtitle:
      'Every message is encrypted before it leaves your device. Not even Locksy can read them.',
    features: [
      { icon: '🔒', text: 'AES-256 encryption' },
      { icon: '🌐', text: 'Peer-to-peer, no server storage' },
      { icon: '👁️', text: 'Zero data retention' },
    ],
    cta: 'Next →',
  },
  {
    id: '2',
    icon: '🆔',
    iconBg: COLORS.purpleLight,
    iconBgSolid: COLORS.purple,
    title: 'Your CID is your\nidentity',
    subtitle: null,
    cidExample: 'A 7 F 3 K 9',
    features: [
      { icon: '🙈', text: 'Never shown to others in groups' },
      { icon: '📱', text: 'Share via QR code or manually' },
    ],
    cta: 'Next →',
  },
  {
    id: '3',
    icon: '🛡️',
    iconBg: '#DBEAFE',
    title: 'You control\neverything',
    subtitle: null,
    features: [
      { icon: '⏱️', title: 'Auto-delete timers', text: 'Messages vanish after reading' },
      { icon: '🔒', title: 'Lock individual chats', text: 'Password required to open' },
      { icon: '💣', title: 'Wipe on 3 wrong attempts', text: 'All data erased automatically' },
    ],
    cta: 'Get Started',
    isFinal: true,
  },
];

function Slide({ item, onNext, navigation }) {
  return (
    <View style={[styles.slide, { width }]}>
      {/* Icon */}
      <View style={styles.iconArea}>
        {item.id === '1' && (
          <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
            <Text style={styles.iconEmoji}>🔐</Text>
            <Text style={[styles.iconEmoji, { position: 'absolute', bottom: -2, right: -2, fontSize: 32 }]}>🗝️</Text>
          </View>
        )}
        {item.id === '2' && (
          <View style={[styles.iconSquare, { backgroundColor: item.iconBgSolid }]}>
            <Text style={styles.idText}>ID</Text>
          </View>
        )}
        {item.id === '3' && (
          <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
            <Text style={{ fontSize: 70 }}>🛡️</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Subtitle / special content */}
      {item.subtitle && (
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      )}

      {item.cidExample && (
        <View style={styles.cidCard}>
          <Text style={styles.cidLabel}>EXAMPLE CID</Text>
          <Text style={styles.cidValue}>{item.cidExample}</Text>
          <Text style={styles.cidHint}>Letters + numbers · 6 characters</Text>
        </View>
      )}

      {/* Feature rows */}
      <View style={styles.featuresContainer}>
        {item.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureTextWrap}>
              {f.title ? (
                <>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </>
              ) : (
                <Text style={styles.featureTextSingle}>{f.text}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={() => {
          if (item.isFinal) {
            navigation.navigate('CID');
          } else {
            onNext();
          }
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>{item.cta}</Text>
      </TouchableOpacity>

      {!item.isFinal && (
        <TouchableOpacity onPress={() => navigation.navigate('CID')}>
          <Text style={styles.skipText}>Skip tutorial</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item }) => (
          <Slide item={item} onNext={goNext} navigation={navigation} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: Platform.OS === 'ios' ? 60 : 48,
    marginBottom: SPACING.sm,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 40,
    left: 0,
    right: 0,
    zIndex: 10,
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
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 110 : 90,
    paddingBottom: SPACING.xl,
  },
  iconArea: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  iconEmoji: {
    fontSize: 64,
  },
  iconSquare: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  idText: {
    fontSize: 42,
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
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  cidCard: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryGlow,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cidLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  cidValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 8,
    marginBottom: SPACING.sm,
  },
  cidHint: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  featuresContainer: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
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
    width: 32,
    textAlign: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  featureTextSingle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: SPACING.md,
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
  skipText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});