// onboardings/SetupProfilePhoto.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCIDContext } from '../context/CIDContext';
import { COLORS, SPACING, RADIUS } from './theme';

export default function SetupProfilePhoto({ navigation, route }) {
  const { nickname = 'User', cid = 'XXXXXX' } = route?.params || {};
  const { updateNickname, updateAvatar } = useCIDContext();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(avatarAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const requestPermission = async (type) => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const handleTakePhoto = async () => {
    const granted = await requestPermission('camera');
    if (!granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
      return;
    }
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        Animated.spring(avatarAnim, {
          toValue: 1.05,
          friction: 5,
          useNativeDriver: true,
        }).start(() => {
          Animated.spring(avatarAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not take photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    const granted = await requestPermission('library');
    if (!granted) {
      Alert.alert('Permission Denied', 'Photo library access is required.');
      return;
    }
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        Animated.spring(avatarAnim, {
          toValue: 1.05,
          friction: 5,
          useNativeDriver: true,
        }).start(() => {
          Animated.spring(avatarAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load image.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterLocksy = () => {
    // Save globally
    updateNickname(nickname);
    if (photo) updateAvatar(photo);

    Alert.alert(
      '🎉 Welcome to Locksy!',
      `Your account is ready, ${nickname}.\n\nYour CID: ${cid}`,
      [
        {
          text: 'Enter',
          onPress: () => {
             navigation.replace('Chats');
          },
        },
      ]
    );
  };

  const avatarLetter = nickname[0]?.toUpperCase() || '?';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Step label */}
      <Text style={styles.stepLabel}>STEP 3 OF 3 — OPTIONAL</Text>

      <Text style={styles.title}>Add a profile photo</Text>
      <Text style={styles.subtitle}>Encrypted locally · Shared E2EE</Text>

      <View style={styles.divider} />

      {/* Avatar */}
      <View style={styles.avatarArea}>
        <Animated.View
          style={[styles.avatarWrapper, { transform: [{ scale: avatarAnim }] }]}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <View style={styles.personIconBody}>
                <View style={styles.personIconHead} />
                <View style={styles.personIconTorso} />
              </View>
            </View>
          )}

          {/* Plus badge */}
          <TouchableOpacity
            style={styles.plusBadge}
            onPress={handleChooseFromLibrary}
            activeOpacity={0.8}
          >
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
          onPress={handleTakePhoto}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.actionBtnEmoji}>📷</Text>
          <Text style={styles.actionBtnText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
          onPress={handleChooseFromLibrary}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.actionBtnEmoji}>🖼️</Text>
          <Text style={styles.actionBtnText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>

      {/* Encryption note */}
      <View style={styles.encNote}>
        <Text style={styles.encNoteText}>
          AES-256 encrypted before storage and before sending
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Enter Locksy */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={handleEnterLocksy}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>Enter Locksy</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleEnterLocksy} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 70 : 55,
    paddingBottom: Platform.OS === 'ios' ? 44 : SPACING.xl,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 38,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  avatarArea: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  personIconBody: {
    alignItems: 'center',
  },
  personIconHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    marginBottom: 4,
  },
  personIconTorso: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  plusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  plusText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 26,
  },
  actionsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnEmoji: {
    fontSize: 20,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  encNote: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  encNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
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
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});