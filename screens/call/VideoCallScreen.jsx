import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { useCalls } from '../../context/CallsContext';

const { height, width } = Dimensions.get('window');

export default function VideoCallScreen({ navigation, route }) {
  const { callInfo } = route?.params || {};
  const {
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    isMuted,
    isSpeaker,
    cameraOn,
    updateCallDuration,
  } = useCalls();
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);

  // Default call info
  const call = callInfo || {
    id: '1',
    name: 'Ghost_Fox',
    avatar: '🦊',
    type: 'video',
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

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    setControlsVisible(true);
    const timeout = setTimeout(() => {
      setControlsVisible(false);
    }, 5000);
    setControlsTimeout(timeout);
  }, []);

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

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

      {/* Video Feed Background */}
      <TouchableOpacity
        style={styles.videoFeed}
        onPress={toggleControls}
        activeOpacity={1}
      >
        {/* Placeholder for video - shows caller avatar when camera off */}
        {!cameraOn ? (
          <View style={styles.videoPlaceholder}>
            <View style={styles.placeholderAvatar}>
              <Text style={styles.placeholderAvatarEmoji}>{call.avatar}</Text>
            </View>
            <Text style={styles.cameraOffText}>Camera Off</Text>
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <MaterialCommunityIcons
              name="video-outline"
              size={64}
              color={COLORS.textMuted}
            />
            <Text style={styles.cameraOffText}>Video Feed</Text>
          </View>
        )}

        {/* Top info bar - visible with controls */}
        {controlsVisible && (
          <View style={styles.topInfo}>
            <View style={styles.encryptionBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.white} />
              <Text style={styles.encryptionText}>ENCRYPTED - P2P</Text>
            </View>
          </View>
        )}

        {/* Remote video thumbnail (caller) */}
        <View style={styles.remoteVideoContainer}>
          <View style={styles.remoteAvatar}>
            <Text style={styles.remoteAvatarEmoji}>{call.avatar}</Text>
          </View>
          
          {/* Duration and name overlay on remote video */}
          <View style={styles.remoteCaller}>
            <Text style={styles.remoteCallerName}>{call.name}</Text>
            <Text style={styles.remoteDuration}>{formatDuration(duration)}</Text>
          </View>

          {/* Verification code */}
          {controlsVisible && (
            <View style={styles.remoteVerification}>
              <MaterialCommunityIcons
                name="check-circle"
                size={12}
                color={COLORS.success}
              />
              <Text style={styles.remoteVerificationText}>A3F9288C</Text>
            </View>
          )}
        </View>

        {/* Local video preview (small) */}
        {controlsVisible && (
          <View style={styles.localVideoContainer}>
            <View style={styles.localVideo}>
              <Ionicons
                name="camera"
                size={20}
                color={COLORS.textMuted}
              />
            </View>
            <Text style={styles.localVideoLabel}>You</Text>
          </View>
        )}

        {/* Bottom Controls - only show when visible */}
        {controlsVisible && (
          <View style={styles.bottomControls}>
            <View style={styles.controlButtonRow}>
              {/* Mute button */}
              <TouchableOpacity
                style={[
                  styles.controlIconBtn,
                  isMuted && styles.controlIconBtnActive,
                ]}
                onPress={toggleMute}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isMuted ? 'microphone-off' : 'microphone'}
                  size={20}
                  color={isMuted ? '#EF4444' : COLORS.white}
                />
              </TouchableOpacity>

              {/* Speaker button */}
              <TouchableOpacity
                style={[
                  styles.controlIconBtn,
                  isSpeaker && styles.controlIconBtnActive,
                ]}
                onPress={toggleSpeaker}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isSpeaker ? 'volume-high' : 'volume-mute'}
                  size={20}
                  color={isSpeaker ? COLORS.primary : COLORS.white}
                />
              </TouchableOpacity>

              {/* Camera toggle button */}
              <TouchableOpacity
                style={[
                  styles.controlIconBtn,
                  !cameraOn && styles.controlIconBtnActive,
                ]}
                onPress={toggleCamera}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={cameraOn ? 'camera' : 'camera-off'}
                  size={20}
                  color={!cameraOn ? '#EF4444' : COLORS.white}
                />
              </TouchableOpacity>

              {/* End Call button */}
              <TouchableOpacity
                style={styles.endCallBtn}
                onPress={handleEndCall}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="call"
                  size={24}
                  color={COLORS.white}
                  style={{ transform: [{ rotateZ: '135deg' }] }}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Status indicator when controls hidden */}
      {!controlsVisible && (
        <View style={styles.statusIndicator}>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  videoFeed: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topInfo: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
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
  remoteVideoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  remoteAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  remoteAvatarEmoji: {
    fontSize: 56,
  },
  remoteCaller: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 140,
  },
  remoteCallerName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  remoteDuration: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  remoteVerification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 20,
  },
  remoteVerificationText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  localVideoContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    alignItems: 'center',
    zIndex: 15,
  },
  localVideo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 8,
  },
  localVideoLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  cameraOffText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    fontFamily: FONTS.semiBold,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 20, 25, 0.7)',
    paddingVertical: SPACING.padding,
    paddingHorizontal: SPACING.padding,
    zIndex: 20,
  },
  controlButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlIconBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  endCallBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  durationBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  durationText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
