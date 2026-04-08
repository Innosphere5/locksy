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
import { COLORS, FONTS, SPACING, RADIUS } from '../../theme';
import { useCalls } from '../../context/CallsContext';

const { height, width } = Dimensions.get('window');

export default function VoiceCallScreen({ navigation, route }) {
  const { callInfo } = route?.params || {};
  const { endCall, toggleMute, toggleSpeaker, isMuted, isSpeaker, updateCallDuration } = useCalls();
  const [duration, setDuration] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Default call info
  const call = callInfo || {
    id: '1',
    name: 'Ghost_Fox',
    avatar: '🦊',
    type: 'voice',
    encrypted: true,
    direction: 'incoming',
  };

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
      updateCallDuration(duration + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [duration]);

  // Format duration display (MM:SS)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    endCall();
    navigation.navigate('Calls');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Background */}
      <View style={styles.backgroundOverlay} />

      {/* Top Status Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            // Minimize call
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.callStatus}>
          {call.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
        </Text>
        <View style={styles.spacer} />
      </View>

      {/* Caller Info */}
      <View style={styles.callerInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{call.avatar}</Text>
        </View>
        <Text style={styles.callerName}>{call.name}</Text>
        <Text style={styles.callDuration}>{formatDuration(duration)}</Text>

        {/* Encryption badge */}
        <View style={styles.encryptionBadge}>
          <Ionicons name="shield-checkmark" size={12} color={COLORS.white} />
          <Text style={styles.encryptionText}>ENCRYPTED - P2P</Text>
        </View>

        {/* Verification code */}
        <View style={styles.verificationCode}>
          <MaterialCommunityIcons
            name="check-circle"
            size={14}
            color={COLORS.success}
          />
          <Text style={styles.verificationText}>A3F9288C — verify</Text>
        </View>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Control buttons */}
        <View style={styles.controlButtonsContainer}>
          {/* Mute button */}
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.controlBtnInner,
                isMuted && styles.controlBtnInnerActive,
              ]}
            >
              <MaterialCommunityIcons
                name={isMuted ? 'microphone-off' : 'microphone'}
                size={20}
                color={isMuted ? '#EF4444' : COLORS.white}
              />
            </View>
            <Text
              style={[
                styles.controlBtnLabel,
                isMuted && styles.controlBtnLabelActive,
              ]}
            >
              MUTE
            </Text>
          </TouchableOpacity>

          {/* Speaker button */}
          <TouchableOpacity
            style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
            onPress={toggleSpeaker}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.controlBtnInner,
                isSpeaker && styles.controlBtnInnerActive,
              ]}
            >
              <MaterialCommunityIcons
                name={isSpeaker ? 'volume-high' : 'volume-mute'}
                size={20}
                color={isSpeaker ? COLORS.primary : COLORS.white}
              />
            </View>
            <Text
              style={[
                styles.controlBtnLabel,
                isSpeaker && styles.controlBtnLabelActive,
              ]}
            >
              SPEAKER
            </Text>
          </TouchableOpacity>

          {/* Keypad button */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => {
              // Open keypad
            }}
            activeOpacity={0.8}
          >
            <View style={styles.controlBtnInner}>
              <MaterialCommunityIcons
                name="dialpad"
                size={20}
                color={COLORS.white}
              />
            </View>
            <Text style={styles.controlBtnLabel}>KEYPAD</Text>
          </TouchableOpacity>
        </View>

        {/* End Call Button */}
        <TouchableOpacity
          style={styles.endCallBtn}
          onPress={handleEndCall}
          activeOpacity={0.8}
        >
          <Ionicons
            name="call"
            size={28}
            color={COLORS.white}
            style={{ transform: [{ rotateZ: '135deg' }] }}
          />
        </TouchableOpacity>

        {/* Additional options */}
        {showMoreOptions && (
          <View style={styles.moreOptions}>
            <TouchableOpacity style={styles.moreOptionBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.moreOptionText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreOptionBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="transit-transfer"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.moreOptionText}>Transfer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Call info footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          P2P • AES-256 • No Recording
        </Text>
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
    backgroundColor: 'rgba(15, 20, 25, 0.3)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.padding,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callStatus: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  spacer: {
    width: 40,
  },
  callerInfo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  callerName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  callDuration: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    fontFamily: FONTS.bold,
    fontVariant: ['tabular-nums'],
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
    marginBottom: 12,
  },
  encryptionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: FONTS.bold,
  },
  verificationCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verificationText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  bottomControls: {
    alignItems: 'center',
    paddingHorizontal: SPACING.padding,
    paddingBottom: SPACING.padding,
  },
  controlButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  controlBtn: {
    alignItems: 'center',
  },
  controlBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlBtnInnerActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  controlBtnLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: FONTS.bold,
  },
  controlBtnActive: {},
  controlBtnLabelActive: {
    color: '#EF4444',
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  moreOptionBtn: {
    alignItems: 'center',
  },
  moreOptionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
});
