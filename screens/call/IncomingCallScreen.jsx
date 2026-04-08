import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SPACING, RADIUS } from '../../theme';
import { useCalls } from '../../context/CallsContext';

const { height } = Dimensions.get('window');

export default function IncomingCallScreen({ navigation, route }) {
  const { acceptCall, declineCall } = useCalls();
  const { caller } = route?.params || {};
  const [ringAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(0));

  // Default caller if not provided
  const callInfo = caller || {
    id: '1',
    name: 'Ghost_Fox',
    avatar: '🦊',
    type: 'voice',
    encrypted: true,
  };

  // Animate ring pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnimation]);

  const handleAccept = () => {
    acceptCall();
    navigation.replace('VoiceCall', { callInfo });
  };

  const handleDecline = () => {
    declineCall();
    navigation.goBack();
  };

  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const pulseOpacity = pulseAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Background gradient overlay */}
      <View style={styles.backgroundOverlay} />

      {/* Top info banner */}
      <View style={styles.topBanner}>
        <View style={styles.encryptionBadge}>
          <Ionicons name="shield-checkmark" size={12} color={COLORS.white} />
          <Text style={styles.encryptionText}>ENCRYPTED - P2P</Text>
        </View>
      </View>

      {/* Caller Avatar and Name */}
      <View style={styles.centerContent}>
        {/* Pulsing rings */}
        <Animated.View
          style={[
            styles.pulseRing1,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing2,
            {
              transform: [
                {
                  scale: pulseAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
              opacity: pulseAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 0.3, 0],
              }),
            },
          ]}
        />

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{callInfo.avatar}</Text>
          </View>
        </View>

        {/* Caller name */}
        <Text style={styles.callerName}>{callInfo.name}</Text>

        {/* Call type */}
        <View style={styles.callTypeContainer}>
          <View style={styles.callTypeBadge}>
            <Text style={styles.callTypeIcon}>
              {callInfo.type === 'voice' ? '🎤' : '📹'}
            </Text>
            <Text style={styles.callTypeText}>
              {callInfo.type === 'voice' ? 'Voice Call' : 'Video Call'}
            </Text>
          </View>
        </View>

        {/* Encryption info */}
        <View style={styles.encryptionInfo}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={14}
            color={COLORS.primary}
          />
          <Text style={styles.encryptionInfoText}>
            A3F9288C — verify
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Spec text */}
        <Text style={styles.specText}>P2P • AES-256 • No Recording</Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Decline Button */}
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={handleDecline}
            activeOpacity={0.8}
          >
            <Ionicons
              name="call"
              size={24}
              color={COLORS.white}
              style={{ transform: [{ rotateZ: '135deg' }] }}
            />
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ringing indicator animation */}
      <View style={styles.ringingIndicator}>
        <View style={[styles.ringingDot, { backgroundColor: '#FF4444' }]} />
        <Text style={styles.ringingText}>Ringing...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
    justifyContent: 'space-between',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 20, 25, 0.4)',
  },
  topBanner: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6,
  },
  encryptionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: FONTS.bold,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.8,
  },
  pulseRing2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: COLORS.primary,
    opacity: 0.6,
  },
  avatarContainer: {
    zIndex: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarEmoji: {
    fontSize: 56,
  },
  callerName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 28,
    fontFamily: FONTS.bold,
  },
  callTypeContainer: {
    marginTop: 12,
  },
  callTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  callTypeIcon: {
    fontSize: 16,
  },
  callTypeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  encryptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  encryptionInfoText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  bottomControls: {
    padding: SPACING.padding,
    alignItems: 'center',
  },
  specText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 24,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  declineBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringingIndicator: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ringingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ringingText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
