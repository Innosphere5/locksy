/**
 * VaultScreen — Screen 50
 * ─────────────────────────────────────────────────────────────────
 * Displays all vault-stored media (images, videos, files, voice).
 * Items are saved automatically when media is sent/received in chat.
 * Deletion here is permanent. Deletion in chat does NOT affect vault.
 * Auto-delete chat features are user-controlled and separate from vault.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
  Modal,
  Image,
  Animated,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import { Video, ResizeMode, Audio } from 'expo-av';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';
import vaultStorage from '../../utils/vaultStorage';

const { width: SCREEN_W } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_W - SPACING.lg * 2 - SPACING.md) / 2;
const TABS = ['All', 'Photos', 'Videos', 'Files', 'Voice'];

// ─── Helper functions ────────────────────────────────────────────

function getTypeColor(type) {
  switch (type) {
    case 'image': return '#EFF6FF';
    case 'video': return '#F5F3FF';
    case 'voice': return '#ECFDF5';
    case 'file':  return '#FFFBEB';
    default:      return COLORS.gray100;
  }
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMs(ms) {
  if (!ms || ms === 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function daysLeft(expiresAt) {
  if (!expiresAt) return 15;
  const diff = expiresAt - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Voice Viewer Modal ───────────────────────────────────────────
// Full-screen audio player with waveform, progress bar, play/pause

function VoiceViewerModal({ visible, item, onClose, onDelete }) {
  const [sound, setSound]           = useState(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isLoading, setIsLoading]   = useState(false);
  const [hasError, setHasError]     = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  // Pulse animation when playing
  useEffect(() => {
    if (isPlaying) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      if (pulseLoop.current) pulseLoop.current.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [isPlaying]);

  // Stop and clean up when modal closes
  useEffect(() => {
    if (!visible) {
      if (sound) {
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
        setSound(null);
      }
      setIsPlaying(false);
      setPositionMs(0);
      setDurationMs(0);
      setHasError(false);
    }
  }, [visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) { sound.unloadAsync().catch(() => {}); }
    };
  }, [sound]);

  const handlePlayPause = async () => {
    if (!item?.localUri) return;
    setHasError(false);

    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      return;
    }

    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.localUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setPositionMs(status.positionMillis || 0);
            if (status.durationMillis) setDurationMs(status.durationMillis);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPositionMs(0);
              newSound.setPositionAsync(0).catch(() => {});
            }
          }
          if (status.error) {
            setHasError(true);
            setIsPlaying(false);
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.error('[VaultVoice] Playback error:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  const days = item ? daysLeft(item.expiresAt) : 15;
  const isUrgent = days <= 3;

  if (!item) return null;

  // Waveform bars - colored by progress
  const BARS = [10, 18, 28, 14, 36, 22, 12, 32, 20, 10, 26, 16, 34, 8, 24, 18, 30, 12, 22, 16];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.voiceModalOverlay} />
      </TouchableWithoutFeedback>

      <View style={styles.voiceModalSheet}>
        {/* Drag handle */}
        <View style={styles.voiceModalHandle} />

        {/* Header */}
        <View style={styles.voiceModalHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.voiceModalCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-down" size={22} color={COLORS.gray500} />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.voiceModalTitle}>Voice Message</Text>
            {item.senderNickname && (
              <Text style={styles.voiceModalSender}>from {item.senderNickname}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => { onDelete(item.id); onClose(); }}
            style={styles.voiceModalDeleteBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Pulse + Mic icon */}
        <View style={styles.voiceModalCenter}>
          {/* Outer pulse ring */}
          <Animated.View
            style={[
              styles.voicePulseRing,
              styles.voicePulseOuter,
              { transform: [{ scale: pulseAnim }], opacity: isPlaying ? 0.15 : 0 },
            ]}
          />
          {/* Middle pulse ring */}
          <Animated.View
            style={[
              styles.voicePulseRing,
              styles.voicePulseMiddle,
              { transform: [{ scale: pulseAnim }], opacity: isPlaying ? 0.25 : 0 },
            ]}
          />
          {/* Mic circle */}
          <View style={styles.voiceMicCircle}>
            <Ionicons name="mic" size={52} color={COLORS.white} />
          </View>
        </View>

        {/* Waveform bars */}
        <View style={styles.voiceWaveRow}>
          {BARS.map((h, i) => {
            const filled = progress > i / BARS.length;
            return (
              <View
                key={i}
                style={[
                  styles.voiceWaveBarModal,
                  {
                    height: h,
                    backgroundColor: filled ? COLORS.primary : COLORS.gray200,
                    opacity: filled ? 1 : 0.6,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Progress + Time */}
        <View style={styles.voiceProgressContainer}>
          <View style={styles.voiceProgressTrack}>
            <View
              style={[
                styles.voiceProgressFill,
                { width: `${progress * 100}%` },
              ]}
            />
            {/* Scrubber dot */}
            <View
              style={[
                styles.voiceProgressDot,
                { left: `${Math.max(progress * 100 - 1, 0)}%` },
              ]}
            />
          </View>
          <View style={styles.voiceTimingRow}>
            <Text style={styles.voiceTimeText}>{formatMs(positionMs)}</Text>
            <Text style={styles.voiceTimeText}>{formatMs(durationMs)}</Text>
          </View>
        </View>

        {/* Play / Pause button */}
        {hasError ? (
          <View style={styles.voiceErrorBox}>
            <Ionicons name="alert-circle-outline" size={22} color={COLORS.error} />
            <Text style={styles.voiceErrorText}>Could not play this file</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.voicePlayPauseBtn}
            onPress={handlePlayPause}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="large" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={38}
                color={COLORS.white}
              />
            )}
          </TouchableOpacity>
        )}

        {/* Meta info */}
        <View style={styles.voiceModalMeta}>
          <View style={[styles.voiceExpiryBadge, isUrgent && { backgroundColor: COLORS.errorLight }]}>
            <Ionicons
              name="time-outline"
              size={12}
              color={isUrgent ? COLORS.error : COLORS.warning}
            />
            <Text style={[styles.voiceExpiryText, isUrgent && { color: COLORS.error }]}>
              {days}d remaining
            </Text>
          </View>
          <Text style={styles.voiceModalDateText}>
            {formatDate(item.createdAt)} · {formatSize(item.size)}
          </Text>
        </View>

        {/* E2E badge */}
        <View style={styles.voiceEncBadge}>
          <MaterialCommunityIcons name="shield-lock" size={13} color={COLORS.encryptionText} />
          <Text style={styles.voiceEncText}>Stored in encrypted vault</Text>
        </View>
      </View>
    </Modal>
  );
}

// ─── Image Viewer Modal ───────────────────────────────────────────

function ImageViewerModal({ visible, item, onClose, onDelete, onShare }) {
  if (!item) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewerBackdrop}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View style={styles.viewerHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.viewerHeaderBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
            <Text style={styles.viewerTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.viewerSubtitle}>{formatDate(item.createdAt)} · {formatSize(item.size)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onShare(item)}
            style={styles.viewerHeaderBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="share-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ width: SPACING.sm }} />
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={[styles.viewerHeaderBtn, { backgroundColor: 'rgba(220,38,38,0.25)' }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="trash-outline" size={20} color="#FCA5A5" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        <Image
          source={{ uri: item.localUri }}
          style={styles.viewerImage}
          resizeMode="contain"
        />

        {/* Footer */}
        <View style={styles.viewerFooter}>
          <MaterialCommunityIcons name="shield-lock" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.viewerFooterText}>
            Encrypted vault · {daysLeft(item.expiresAt)}d remaining
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ─── Video Viewer Modal ───────────────────────────────────────────

function VideoViewerModal({ visible, item, onClose, onDelete, onShare }) {
  if (!item) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewerBackdrop}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <View style={styles.viewerHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.viewerHeaderBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
            <Text style={styles.viewerTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.viewerSubtitle}>{formatDate(item.createdAt)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onShare(item)}
            style={styles.viewerHeaderBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="share-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ width: SPACING.sm }} />
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={[styles.viewerHeaderBtn, { backgroundColor: 'rgba(220,38,38,0.25)' }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="trash-outline" size={20} color="#FCA5A5" />
          </TouchableOpacity>
        </View>

        <Video
          source={{ uri: item.localUri }}
          style={styles.viewerVideo}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
        />

        <View style={styles.viewerFooter}>
          <MaterialCommunityIcons name="shield-lock" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.viewerFooterText}>
            Encrypted vault · {daysLeft(item.expiresAt)}d remaining
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ─── Item Options Bottom Sheet ────────────────────────────────────

function ItemOptionsSheet({ visible, item, onClose, onDelete, onPin, onShare }) {
  if (!item) return null;

  const typeLabels = { image: 'Photo', video: 'Video', file: 'File', voice: 'Voice' };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sheetBackdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.sheetHandle} />

        {/* Item preview row */}
        <View style={styles.sheetItemRow}>
          <View style={[styles.sheetItemIcon, { backgroundColor: getTypeColor(item.type) }]}>
            {item.type === 'image' ? (
              <Ionicons name="image" size={22} color={COLORS.primary} />
            ) : item.type === 'video' ? (
              <Ionicons name="videocam" size={22} color="#7C3AED" />
            ) : item.type === 'voice' ? (
              <Ionicons name="mic" size={22} color={COLORS.success} />
            ) : (
              <MaterialCommunityIcons name="file-document" size={22} color={COLORS.warning} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetItemName} numberOfLines={1}>
              {item.name || typeLabels[item.type] || 'Media'}
            </Text>
            <Text style={styles.sheetItemMeta}>
              {formatSize(item.size)} · {formatDate(item.createdAt)} · {daysLeft(item.expiresAt)}d left
            </Text>
          </View>
        </View>

        <View style={styles.sheetDivider} />

        {/* Pin action */}
        <TouchableOpacity
          style={styles.sheetAction}
          onPress={() => { onPin(item.id); onClose(); }}
          activeOpacity={0.7}
        >
          <View style={[styles.sheetActionIcon, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons
              name={item.pinned ? 'pin-off' : 'pin'}
              size={20}
              color={COLORS.warning}
            />
          </View>
          <Text style={styles.sheetActionText}>{item.pinned ? 'Unpin' : 'Pin to Top'}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
        </TouchableOpacity>

        {/* Share action */}
        <TouchableOpacity
          style={styles.sheetAction}
          onPress={() => { onShare(item); onClose(); }}
          activeOpacity={0.7}
        >
          <View style={[styles.sheetActionIcon, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name="share-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.sheetActionText}>Share / Open</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
        </TouchableOpacity>

        <View style={styles.sheetDivider} />

        {/* Delete action */}
        <TouchableOpacity
          style={styles.sheetAction}
          onPress={() => { onDelete(item.id); onClose(); }}
          activeOpacity={0.7}
        >
          <View style={[styles.sheetActionIcon, { backgroundColor: COLORS.errorLight }]}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </View>
          <Text style={[styles.sheetActionText, { color: COLORS.error }]}>Delete Permanently</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.error} />
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          style={[styles.sheetAction, styles.cancelAction]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Vault Item Card ──────────────────────────────────────────────

function VaultItemCard({ item, onPress, onLongPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const days = daysLeft(item.expiresAt);
  const isUrgent = days <= 3;

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 40, bounciness: 4 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        delayLongPress={400}
      >
        {/* Thumbnail */}
        <View style={[styles.cardThumb, { backgroundColor: getTypeColor(item.type) }]}>

          {item.type === 'image' ? (
            <>
              <Image source={{ uri: item.localUri }} style={styles.cardImage} resizeMode="cover" />
              {/* Gradient overlay for info */}
              <View style={styles.cardImageOverlay} />
            </>
          ) : item.type === 'video' ? (
            <View style={styles.videoThumbContainer}>
              <View style={styles.videoIconBg}>
                <Ionicons name="videocam" size={30} color="#7C3AED" />
              </View>
              <View style={styles.videoPlayBadge}>
                <Ionicons name="play" size={12} color={COLORS.white} />
                <Text style={styles.videoPlayLabel}>Play</Text>
              </View>
            </View>
          ) : item.type === 'voice' ? (
            <View style={styles.voiceThumbContainer}>
              <View style={styles.voiceIconBg}>
                <Ionicons name="mic" size={30} color={COLORS.success} />
              </View>
              <View style={styles.voiceWaves}>
                {[8, 14, 10, 20, 12, 18, 8].map((h, i) => (
                  <View
                    key={i}
                    style={[styles.waveBar, { height: h, backgroundColor: COLORS.success }]}
                  />
                ))}
              </View>
              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>Tap to play</Text>
              </View>
            </View>
          ) : (
            // File
            <View style={styles.fileThumbContainer}>
              {item.name?.toLowerCase().endsWith('.pdf') ? (
                <MaterialCommunityIcons name="file-pdf-box" size={44} color={COLORS.error} />
              ) : item.name?.toLowerCase().endsWith('.doc') || item.name?.toLowerCase().endsWith('.docx') ? (
                <MaterialCommunityIcons name="file-word" size={44} color="#2563EB" />
              ) : (
                <MaterialCommunityIcons name="file-document-outline" size={44} color={COLORS.warning} />
              )}
              <Text style={styles.fileExtLabel}>
                {item.name ? item.name.split('.').pop().toUpperCase() : 'FILE'}
              </Text>
            </View>
          )}

          {/* Pinned badge */}
          {item.pinned && (
            <View style={styles.pinnedBadge}>
              <MaterialCommunityIcons name="pin" size={10} color={COLORS.white} />
            </View>
          )}

          {/* Expiry urgent badge */}
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>{days}d</Text>
            </View>
          )}
        </View>

        {/* Card info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name || 'Untitled'}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardDays, isUrgent && styles.cardDaysUrgent]}>
              {days}d left
            </Text>
            <Text style={styles.cardSize}>{formatSize(item.size)}</Text>
          </View>
          {item.senderNickname ? (
            <Text style={styles.cardSender} numberOfLines={1}>
              {item.senderNickname}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────

function EmptyVault({ tab }) {
  const config = {
    All:    { icon: 'lock-closed', color: COLORS.primary,  bg: COLORS.primaryLight, msg: 'Send or receive photos, videos,\nfiles, or voice messages in chat.\nThey\'ll appear here automatically.' },
    Photos: { icon: 'image',       color: COLORS.primary,  bg: '#EFF6FF',            msg: 'No photos yet.\nSend or receive a photo in chat.' },
    Videos: { icon: 'videocam',    color: '#7C3AED',        bg: '#F5F3FF',            msg: 'No videos yet.\nSend or receive a video in chat.' },
    Files:  { icon: 'document-text', color: COLORS.warning, bg: '#FFFBEB',           msg: 'No files yet.\nSend or receive a file in chat.' },
    Voice:  { icon: 'mic',          color: COLORS.success,  bg: '#ECFDF5',           msg: 'No voice messages yet.\nSend or receive one in chat.' },
  };
  const c = config[tab] || config.All;

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconRing, { backgroundColor: c.bg, borderColor: c.color + '33' }]}>
        <Ionicons name={c.icon} size={48} color={c.color} />
      </View>
      <Text style={styles.emptyTitle}>
        {tab === 'All' ? 'Vault is empty' : `No ${tab.toLowerCase()} yet`}
      </Text>
      <Text style={styles.emptyDesc}>{c.msg}</Text>
      <View style={styles.emptyBadgeRow}>
        <MaterialCommunityIcons name="shield-lock" size={13} color={COLORS.encryptionText} />
        <Text style={styles.emptyBadgeText}>AES-256 · stored locally · 15-day expiry</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────

export default function VaultScreen({ navigation }) {
  const [allItems,   setAllItems]   = useState([]);
  const [activeTab,  setActiveTab]  = useState('All');
  const [loading,    setLoading]    = useState(true);

  // Viewer modals
  const [viewerItem, setViewerItem] = useState(null);
  const [viewerType, setViewerType] = useState(null); // 'image' | 'video' | 'voice'

  // Options bottom sheet
  const [sheetItem, setSheetItem]   = useState(null);

  // Reload every time screen gains focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        const items = await vaultStorage.getVaultItems();
        if (active) {
          setAllItems(items);
          setLoading(false);
        }
      };
      load();
      return () => { active = false; };
    }, [])
  );

  // ── Filtered + sorted list ─────────────────────────────────────

  const typeMap = { Photos: 'image', Videos: 'video', Files: 'file', Voice: 'voice' };

  const sorted = [...(
    activeTab === 'All'
      ? allItems
      : allItems.filter(i => i.type === typeMap[activeTab])
  )].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });

  // ── Handlers ──────────────────────────────────────────────────

  const handleItemPress = (item) => {
    if (item.type === 'image') {
      setViewerItem(item);
      setViewerType('image');
    } else if (item.type === 'video') {
      setViewerItem(item);
      setViewerType('video');
    } else if (item.type === 'voice') {
      // Open voice player modal
      setViewerItem(item);
      setViewerType('voice');
    } else {
      // File — open with system viewer
      handleShare(item);
    }
  };

  const handleLongPress = (item) => {
    setSheetItem(item);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete from Vault',
      'This file will be permanently deleted and cannot be recovered. This does not affect your chat history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await vaultStorage.deleteVaultItem(id);
            setAllItems(prev => prev.filter(i => i.id !== id));
            setViewerItem(null);
            setViewerType(null);
          },
        },
      ]
    );
  };

  const handlePin = async (id) => {
    await vaultStorage.togglePin(id);
    const updated = await vaultStorage.getVaultItems();
    setAllItems(updated);
  };

  const handleShare = async (item) => {
    try {
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(item.localUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: item.mimeType || 'application/octet-stream',
        });
      } else {
        await Sharing.shareAsync(item.localUri);
      }
    } catch {
      try {
        await Sharing.shareAsync(item.localUri);
      } catch {
        Alert.alert('Error', 'Could not open this file.');
      }
    }
  };

  const handleCloseViewer = () => {
    setViewerItem(null);
    setViewerType(null);
  };

  // ── Stats ──────────────────────────────────────────────────────

  const statsPhotos = allItems.filter(i => i.type === 'image').length;
  const statsVideos = allItems.filter(i => i.type === 'video').length;
  const statsFiles  = allItems.filter(i => i.type === 'file').length;
  const statsVoice  = allItems.filter(i => i.type === 'voice').length;

  // ── Render ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.lockIconWrap}>
            <Ionicons name="lock-closed" size={22} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Vault</Text>
            <Text style={styles.headerSub}>
              {allItems.length} item{allItems.length !== 1 ? 's' : ''} · local
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() =>
            Alert.alert(
              '🔐 About Vault',
              'Vault automatically saves every image, video, file, and voice message you send or receive — regardless of whether you delete the message from chat.\n\nItems are stored locally on your device and auto-removed after 15 days.\n\nChat auto-delete (if enabled) is a separate user-controlled feature and does not affect the vault.'
            )
          }
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="information-circle-outline" size={23} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Info Banner ── */}
      <View style={styles.warningBanner}>
        <Ionicons name="time-outline" size={13} color="#92400E" />
        <Text style={styles.warningText}>
          Auto-removed after 15 days · stored locally · not synced
        </Text>
      </View>

      {/* ── Stats pills (only when items exist) ── */}
      {allItems.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          {statsPhotos > 0 && (
            <TouchableOpacity
              style={[styles.statPill, activeTab === 'Photos' && styles.statPillActive]}
              onPress={() => setActiveTab('Photos')}
              activeOpacity={0.7}
            >
              <Ionicons name="image" size={13} color={COLORS.primary} />
              <Text style={styles.statText}>{statsPhotos} Photo{statsPhotos !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
          {statsVideos > 0 && (
            <TouchableOpacity
              style={[styles.statPill, { backgroundColor: '#F5F3FF' }, activeTab === 'Videos' && styles.statPillActive]}
              onPress={() => setActiveTab('Videos')}
              activeOpacity={0.7}
            >
              <Ionicons name="videocam" size={13} color="#7C3AED" />
              <Text style={[styles.statText, { color: '#7C3AED' }]}>{statsVideos} Video{statsVideos !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
          {statsFiles > 0 && (
            <TouchableOpacity
              style={[styles.statPill, { backgroundColor: '#FFFBEB' }, activeTab === 'Files' && styles.statPillActive]}
              onPress={() => setActiveTab('Files')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text" size={13} color={COLORS.warning} />
              <Text style={[styles.statText, { color: COLORS.warning }]}>{statsFiles} File{statsFiles !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
          {statsVoice > 0 && (
            <TouchableOpacity
              style={[styles.statPill, { backgroundColor: '#ECFDF5' }, activeTab === 'Voice' && styles.statPillActive]}
              onPress={() => setActiveTab('Voice')}
              activeOpacity={0.7}
            >
              <Ionicons name="mic" size={13} color={COLORS.success} />
              <Text style={[styles.statText, { color: COLORS.success }]}>{statsVoice} Voice</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading vault…</Text>
        </View>
      ) : sorted.length === 0 ? (
        <EmptyVault tab={activeTab} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VaultItemCard
              item={item}
              onPress={() => handleItemPress(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
        />
      )}

      {/* ── Bottom Navigation ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Chats')}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.navLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Groups')}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.navLabel}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <View style={styles.navActivePill}>
            <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
          </View>
          <Text style={[styles.navLabel, { color: COLORS.primary, fontWeight: '600' }]}>Vault</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <ImageViewerModal
        visible={viewerType === 'image' && !!viewerItem}
        item={viewerItem}
        onClose={handleCloseViewer}
        onDelete={(id) => { handleCloseViewer(); handleDelete(id); }}
        onShare={handleShare}
      />

      <VideoViewerModal
        visible={viewerType === 'video' && !!viewerItem}
        item={viewerItem}
        onClose={handleCloseViewer}
        onDelete={(id) => { handleCloseViewer(); handleDelete(id); }}
        onShare={handleShare}
      />

      <VoiceViewerModal
        visible={viewerType === 'voice' && !!viewerItem}
        item={viewerItem}
        onClose={handleCloseViewer}
        onDelete={(id) => { handleCloseViewer(); handleDelete(id); }}
      />

      <ItemOptionsSheet
        visible={!!sheetItem}
        item={sheetItem}
        onClose={() => setSheetItem(null)}
        onDelete={handleDelete}
        onPin={handlePin}
        onShare={handleShare}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  lockIconWrap: {
    width: 46, height: 46, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.md,
  },
  headerTitle: { fontSize: 21, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', marginTop: 1 },
  infoBtn: { padding: SPACING.sm },

  // Warning banner
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: '#FFFBEB', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  warningText: { fontSize: 11, color: '#92400E', fontWeight: '500', flex: 1 },

  // Stats
  statsRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'transparent',
  },
  statPillActive: { borderColor: COLORS.primary },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // Tabs
  tabContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary, marginTop: 3,
  },

  // Grid
  gridContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  gridRow: { justifyContent: 'space-between', marginBottom: SPACING.md },

  // Card
  cardWrapper: { width: ITEM_SIZE },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    overflow: 'hidden', ...SHADOWS.md,
  },
  cardThumb: {
    width: '100%', height: ITEM_SIZE * 0.72,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'transparent',
  },

  // Video card
  videoThumbContainer: { justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  videoIconBg: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(124,58,237,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  videoPlayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    backgroundColor: 'rgba(124,58,237,0.85)', borderRadius: RADIUS.full,
  },
  videoPlayLabel: { fontSize: 10, color: COLORS.white, fontWeight: '700' },

  // Voice card
  voiceThumbContainer: { justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  voiceIconBg: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(16,185,129,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  voiceWaves: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 3, borderRadius: 2 },
  tapHint: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: RADIUS.full,
  },
  tapHintText: { fontSize: 9, color: COLORS.success, fontWeight: '700' },

  // File card
  fileThumbContainer: { justifyContent: 'center', alignItems: 'center', gap: SPACING.xs },
  fileExtLabel: { fontSize: 10, fontWeight: '800', color: COLORS.warning, letterSpacing: 1.2 },

  // Card badges
  pinnedBadge: {
    position: 'absolute', top: 7, right: 7,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.warning, justifyContent: 'center', alignItems: 'center',
  },
  urgentBadge: {
    position: 'absolute', top: 7, left: 7,
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: COLORS.error, borderRadius: RADIUS.full,
  },
  urgentBadgeText: { fontSize: 9, color: COLORS.white, fontWeight: '800' },

  // Card info
  cardInfo: { padding: SPACING.sm + 1, paddingBottom: SPACING.md },
  cardName: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDays: { fontSize: 10, color: COLORS.warning, fontWeight: '700' },
  cardDaysUrgent: { color: COLORS.error },
  cardSize: { fontSize: 10, color: COLORS.textMuted },
  cardSender: { fontSize: 10, color: COLORS.textMuted, marginTop: 3 },

  // ── Voice Modal ──────────────────────────────────────────────────
  voiceModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  voiceModalSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 36,
    ...SHADOWS.lg,
  },
  voiceModalHandle: {
    width: 42, height: 5, borderRadius: 3,
    backgroundColor: COLORS.gray300, alignSelf: 'center', marginTop: 14, marginBottom: SPACING.md,
  },
  voiceModalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
  },
  voiceModalCloseBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center',
  },
  voiceModalDeleteBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.errorLight, justifyContent: 'center', alignItems: 'center',
  },
  voiceModalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  voiceModalSender: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  voiceModalCenter: {
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
    marginVertical: SPACING.xl,
    width: 160, height: 160,
  },
  voicePulseRing: {
    position: 'absolute', borderRadius: 100,
    backgroundColor: COLORS.primary,
  },
  voicePulseOuter:  { width: 160, height: 160 },
  voicePulseMiddle: { width: 130, height: 130 },
  voiceMicCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.lg,
  },

  // Waveform bars
  voiceWaveRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl,
    height: 44,
  },
  voiceWaveBarModal: { width: 4, borderRadius: 3 },

  // Progress
  voiceProgressContainer: {
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl,
  },
  voiceProgressTrack: {
    height: 4, backgroundColor: COLORS.gray200, borderRadius: 3, position: 'relative',
    overflow: 'hidden',
  },
  voiceProgressFill: {
    height: '100%', backgroundColor: COLORS.primary,
    borderRadius: 3, minWidth: 0,
  },
  voiceProgressDot: {
    position: 'absolute', top: -5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.primary, marginLeft: -7,
  },
  voiceTimingRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm,
  },
  voiceTimeText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  // Play / Pause
  voicePlayPauseBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },

  // Error
  voiceErrorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    alignSelf: 'center', marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.errorLight, borderRadius: RADIUS.lg,
  },
  voiceErrorText: { fontSize: 14, color: COLORS.error, fontWeight: '500' },

  // Meta
  voiceModalMeta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.md, marginBottom: SPACING.md, paddingHorizontal: SPACING.lg,
  },
  voiceExpiryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    backgroundColor: COLORS.warningLight, borderRadius: RADIUS.full,
  },
  voiceExpiryText: { fontSize: 11, color: COLORS.warning, fontWeight: '600' },
  voiceModalDateText: { fontSize: 12, color: COLORS.textMuted },
  voiceEncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.encryptionBg, borderRadius: RADIUS.full,
  },
  voiceEncText: { fontSize: 11, color: COLORS.encryptionText, fontWeight: '500' },

  // ── Image / Video Viewer ─────────────────────────────────────────
  viewerBackdrop: { flex: 1, backgroundColor: '#000' },
  viewerHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? 36 : SPACING.xl,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewerHeaderBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  viewerTitle: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  viewerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  viewerImage: { flex: 1, width: SCREEN_W },
  viewerVideo: { flex: 1, width: SCREEN_W },
  viewerFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewerFooterText: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },

  // ── Options Sheet ─────────────────────────────────────────────────
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, paddingHorizontal: SPACING.lg,
    ...SHADOWS.lg,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.gray300, alignSelf: 'center',
    marginTop: 12, marginBottom: SPACING.lg,
  },
  sheetItemRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md,
  },
  sheetItemIcon: {
    width: 48, height: 48, borderRadius: RADIUS.lg,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetItemName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  sheetItemMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  sheetDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  sheetAction: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, paddingVertical: SPACING.md,
  },
  sheetActionIcon: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetActionText: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.text },
  cancelAction: { justifyContent: 'center', marginTop: SPACING.xs },
  cancelText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },

  // ── Empty ─────────────────────────────────────────────────────────
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxxl },
  emptyIconRing: {
    width: 116, height: 116, borderRadius: 58,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.xl, borderWidth: 2,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.text,
    marginBottom: SPACING.sm, textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 22, marginBottom: SPACING.xl,
  },
  emptyBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.encryptionBg, borderRadius: RADIUS.full,
  },
  emptyBadgeText: { fontSize: 11, color: COLORS.encryptionText, fontWeight: '500' },

  // ── Loading ───────────────────────────────────────────────────────
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: 13, color: COLORS.textMuted },

  // ── Bottom Nav ────────────────────────────────────────────────────
  bottomNav: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: 20, paddingTop: 10, backgroundColor: COLORS.background,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navActivePill: {
    paddingHorizontal: SPACING.md, paddingVertical: 3,
    borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight,
  },
  navLabel: { fontSize: 11, color: COLORS.tabInactive, fontWeight: '500' },
});
