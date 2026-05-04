import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  useWindowDimensions,
  Dimensions,
  Image,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme/colors';
import AttachMediaModal from '../modals/AttachMediaModal';
import PinPad from '../common/PinPad';
import { Audio, Video, ResizeMode } from 'expo-av';
import socketService from '../../utils/socketService';
import messageStorage from '../../utils/messageStorage';
import vaultStorage from '../../utils/vaultStorage';
import { useCIDContext } from '../../context/CIDContext';
import { setChatLock, clearChatLock, getChatLockStatus } from '../../utils/secureStorage';
import mediaService from '../../src/services/mediaService';
import { uploadE2EEFile, downloadAndDecryptFile } from '../../utils/e2eeFileService';
import { deriveSharedSecret } from '../../utils/cryptoEngine';

// ============================================================================
// RESPONSIVE UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate responsive font size based on screen width
 * Uses a scale that adapts from mobile (320px) to tablet (768px+)
 */
const responsiveFontSize = (baseSize, screenWidth) => {
  const scale = screenWidth / 375; // Base scale from iPhone 11 (375px)
  const scaledSize = baseSize * scale;

  // Ensure readability - cap at reasonable min/max
  return Math.min(Math.max(scaledSize, baseSize * 0.8), baseSize * 1.4);
};

/**
 * Calculate responsive spacing/dimension based on screen width
 */
const responsiveSize = (baseSize, screenWidth) => {
  const scale = screenWidth / 375;
  return Math.round(baseSize * scale);
};

/**
 * Calculate message bubble max-width based on screen dimensions
 * Accounts for padding, avatar, and checkboxes
 */
const getMessageBubbleMaxWidth = (screenWidth, isSelected = false) => {
  const padding = isSelected ? 80 : 60; // Space for checkbox + padding if needed
  const maxWidthPercent = screenWidth > 768 ? 0.6 : 0.75; // 60% on tablet, 75% on mobile
  return screenWidth * maxWidthPercent - padding;
};

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_MESSAGES = [
  {
    id: '1',
    sender: 'received',
    text: 'Meet at the usual place.',
    time: '14:20',
    avatar: '🦊',
    username: 'Alex',
    reactions: [],
    timerMinutes: null,
    isViewOnce: false,
    type: 'text',
    isRead: true,
    isForwarded: false,
  },
  {
    id: '2',
    sender: 'sent',
    text: 'Confirmed. ETA 20 min.',
    time: '14:21',
    reactions: ['👍', '❤️'],
    timerMinutes: 48,
    type: 'text',
    readStatus: 'double-check',
    isForwarded: false,
  },
  {
    id: '3',
    sender: 'system',
    type: 'notification',
    notificationType: 'missed-call',
    text: 'Missed Voice Call',
    metadata: 'E2EE · P2P',
    time: '14:22',
    isForwarded: false,
  },
  {
    id: '4',
    sender: 'received',
    text: 'Roger that!',
    time: '14:22',
    avatar: '🦊',
    username: 'Alex',
    reactions: [],
    timerMinutes: 2,
    isEncrypted: true,
    type: 'text',
    isRead: true,
    isForwarded: false,
  },
  {
    id: '5',
    sender: 'sent',
    text: 'Sorry, was in a meeting 📞',
    time: '14:20',
    reactions: [],
    type: 'text',
    readStatus: 'sent',
    isForwarded: true,
  },
  {
    id: '6',
    sender: 'sent',
    text: '',
    time: '14:23',
    type: 'voice',
    duration: '0:23',
    timerMinutes: 60,
    readStatus: 'double-check',
    isForwarded: false,
  },
  {
    id: '7',
    sender: 'received',
    text: 'Check this out',
    time: '14:24',
    avatar: '🦊',
    username: 'Alex',
    reactions: [],
    type: 'view-once',
    isRead: true,
    isForwarded: false,
  },
  {
    id: '8',
    sender: 'system',
    type: 'system-info',
    text: 'Messages and calls are encrypted. Tap to learn more.',
    time: '14:00',
  },
];

const REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '😢'];

// ============================================================================
// ============================================================================
// VOICE MESSAGE PLAYER COMPONENT
// ============================================================================

function VoiceMessagePlayer({ uri, durationText, isSent, screenWidth }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const togglePlayback = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } else {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          uri.startsWith('data:') || uri.startsWith('http') || uri.startsWith('file') ? { uri } : { uri: `data:audio/m4a;base64,${uri}` },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
                newSound.setPositionAsync(0);
              }
            }
          }
        );
        setSound(newSound);
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }
  };

  return (
    <View style={[styles.voiceContainer, {
      minWidth: responsiveSize(150, screenWidth),
      backgroundColor: isSent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
      padding: SPACING.sm,
      borderRadius: RADIUS.md
    }]}>
      <TouchableOpacity onPress={togglePlayback} style={styles.voicePlayBtn}>
        <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>
          {isPlaying ? '⏸️' : '▶️'}
        </Text>
      </TouchableOpacity>

      <View style={styles.voiceWaveform}>
        {/* Simple visualization dash */}
        <View style={[styles.waveLine, { backgroundColor: isSent ? COLORS.white : COLORS.primary }]} />
        <View style={[styles.waveLine, { height: 12, backgroundColor: isSent ? COLORS.white : COLORS.primary }]} />
        <View style={[styles.waveLine, { height: 8, backgroundColor: isSent ? COLORS.white : COLORS.primary }]} />
        <View style={[styles.waveLine, { height: 16, backgroundColor: isSent ? COLORS.white : COLORS.primary }]} />
        <View style={[styles.waveLine, { backgroundColor: isSent ? COLORS.white : COLORS.primary }]} />
      </View>

      <Text style={[
        styles.voiceDurationText,
        {
          color: isSent ? COLORS.sentText : COLORS.receivedText,
          fontSize: responsiveFontSize(12, screenWidth)
        }
      ]}>
        {durationText || 'Voice'}
      </Text>
    </View>
  );
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT (RESPONSIVE)
// ============================================================================

function MessageBubble({ msg, onLongPress, onReplyPress, isSelected, onSelect, screenDimensions, onImagePress, onFilePress, onViewOncePress }) {
  const isSent = msg.sender === 'sent';
  const isSystem = msg.sender === 'system';
  const { screenWidth, screenHeight } = screenDimensions;

  // Responsive sizing
  const bubbleMaxWidth = getMessageBubbleMaxWidth(screenWidth, isSelected);
  const avatarSize = responsiveSize(32, screenWidth);
  const fontSize = responsiveFontSize(14, screenWidth);
  const smallFontSize = responsiveFontSize(11, screenWidth);

  // Notification type message
  if (msg.type === 'notification') {
    if (msg.notificationType === 'missed-call') {
      return (
        <View style={styles.notificationContainer}>
          <View style={[styles.missedCallNotif, { maxWidth: screenWidth * 0.9 }]}>
            <Text style={{ fontSize: responsiveFontSize(24, screenWidth) }}>📞</Text>
            <View style={styles.notifContent}>
              <Text style={[styles.notifTitle, { fontSize: responsiveFontSize(14, screenWidth) }]}>
                {msg.text}
              </Text>
              <Text style={[styles.notifSubtitle, { fontSize: smallFontSize }]}>
                {msg.metadata}
              </Text>
            </View>
            <TouchableOpacity style={styles.callBackBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.callBackText, { fontSize: responsiveFontSize(12, screenWidth) }]}>
                Call Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  // System info message
  if (msg.type === 'system-info') {
    return (
      <View style={styles.systemInfoContainer}>
        <View style={[styles.systemInfoBox, { maxWidth: screenWidth * 0.9 }]}>
          <Text style={[styles.systemInfoText, { fontSize: responsiveFontSize(13, screenWidth) }]}>
            {msg.text}
          </Text>
        </View>
      </View>
    );
  }

  // Regular text/voice/view-once messages
  return (
    <View style={[styles.messageRow, isSent && styles.sentRow]}>
      {/* Avatar for received messages */}
      {!isSent && (
        <View style={[styles.smallAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, overflow: 'hidden' }]}>
          {msg.avatar && msg.avatar.startsWith('http') || msg.avatar.startsWith('file') || msg.avatar.startsWith('content') ? (
            <Image source={{ uri: msg.avatar }} style={{ width: avatarSize, height: avatarSize }} />
          ) : (
            <Text style={{ fontSize: responsiveFontSize(16, screenWidth) }}>{msg.avatar || '👤'}</Text>
          )}
        </View>
      )}

      {/* Selection checkbox for multi-select mode */}
      {isSelected !== undefined && (
        <TouchableOpacity
          style={[styles.selectCheckbox, {
            width: responsiveSize(24, screenWidth),
            height: responsiveSize(24, screenWidth),
            borderRadius: responsiveSize(12, screenWidth),
          }]}
          onPress={() => onSelect && onSelect(msg.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isSelected && <Text style={{ fontSize: responsiveFontSize(14, screenWidth) }}>✓</Text>}
        </TouchableOpacity>
      )}

      {/* Message bubble */}
      <TouchableOpacity
        onLongPress={() => onLongPress(msg)}
        activeOpacity={0.7}
        delayLongPress={300}
        onPress={() => onSelect && onSelect(msg.id)}
        style={{ maxWidth: bubbleMaxWidth }}
      >
        {/* Nickname for received messages */}
        {!isSent && msg.senderNickname && (
          <Text style={[styles.senderNickname, { fontSize: smallFontSize, marginBottom: 2 }]}>
            {msg.senderNickname}
          </Text>
        )}
        <View
          style={[
            styles.bubble,
            isSent ? styles.sentBubble : styles.receivedBubble,
            (msg.type === 'image' || msg.type === 'video') && styles.imageBubble,
            isSelected && styles.bubbleSelected,
            { maxWidth: bubbleMaxWidth }
          ]}
        >
          {/* Forwarded indicator */}
          {msg.isForwarded && (
            <View style={styles.forwardedIndicator}>
              <Text style={{ fontSize: responsiveFontSize(12, screenWidth) }}>📤</Text>
              <Text style={[styles.forwardedText, { fontSize: responsiveFontSize(11, screenWidth) }]}>
                Forwarded
              </Text>
            </View>
          )}

          {/* Message content based on type */}
          {msg.type === 'voice' ? (
            <VoiceMessagePlayer
              uri={msg.voiceUri}
              durationText={msg.duration}
              isSent={isSent}
              screenWidth={screenWidth}
            />
          ) : msg.type === 'view-once' ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => !msg.isOpened && onViewOncePress && onViewOncePress(msg)}
              style={styles.viewOnceContainer}
            >
              <Text style={{ fontSize: responsiveFontSize(16, screenWidth) }}>
                {msg.isOpened ? '💨' : '👁️'}
              </Text>
              <Text
                style={[
                  styles.bubbleText,
                  {
                    color: isSent ? COLORS.sentText : COLORS.receivedText,
                    fontSize: fontSize,
                    fontStyle: msg.isOpened ? 'italic' : 'normal',
                    opacity: msg.isOpened ? 0.7 : 1
                  },
                ]}
              >
                {msg.isOpened ? 'Opened' : `View Once · ${msg.originalType === 'video' ? 'Video' : (msg.originalType === 'file' ? 'File' : (msg.originalType === 'voice' ? 'Voice' : (msg.originalType === 'text' ? 'Message' : 'Photo')))}`}
              </Text>
            </TouchableOpacity>
          ) : msg.type === 'video' ? (
            <View style={[styles.imageContainer, { width: bubbleMaxWidth, height: bubbleMaxWidth * 0.75, backgroundColor: '#000' }]}>
              <Video
                source={{ uri: msg.videoUri }}
                style={{ width: '100%', height: '100%', borderRadius: RADIUS.md }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />
            </View>
          ) : msg.type === 'image' ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onImagePress && onImagePress(msg.image)}
              style={styles.imageContainer}
            >
              <Image
                source={{ uri: msg.image }}
                style={[
                  styles.bubbleImage,
                  {
                    width: bubbleMaxWidth,
                    height: bubbleMaxWidth * 0.75,
                    borderRadius: RADIUS.md
                  }
                ]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : msg.type === 'file' ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onFilePress && onFilePress(msg)}
              style={styles.fileContainer}
            >
              <View style={styles.fileIconBox}>
                <Text style={{ fontSize: responsiveFontSize(24, screenDimensions.screenWidth) }}>
                  {msg.fileName?.toLowerCase().endsWith('.pdf') ? '📕' : '📘'}
                </Text>
              </View>
              <View style={styles.fileInfo}>
                <Text
                  style={[
                    styles.fileName,
                    { color: isSent ? COLORS.sentText : COLORS.receivedText, fontSize: fontSize }
                  ]}
                  numberOfLines={1}
                >
                  {msg.fileName || 'Document'}
                </Text>
                <Text style={[styles.fileSize, { color: isSent ? 'rgba(255,255,255,0.7)' : COLORS.gray500, fontSize: smallFontSize }]}>
                  {msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB` : 'Media File'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.bubbleText,
                {
                  color: isSent ? COLORS.sentText : COLORS.receivedText,
                  fontSize: fontSize
                },
              ]}
            >
              {msg.text}
            </Text>
          )}

          {/* Encryption indicator for received messages */}
          {!isSent && msg.isEncrypted && (
            <View style={styles.encryptionIndicator}>
              <Text style={{ fontSize: responsiveFontSize(11, screenWidth) }}>🔐</Text>
            </View>
          )}



          {/* Reactions */}
          {msg.reactions && msg.reactions.length > 0 && (
            <View style={styles.reactionRow}>
              {msg.reactions.map((emoji, i) => (
                <View key={i} style={styles.reactionPill}>
                  <Text style={{ fontSize: responsiveFontSize(13, screenWidth) }}>
                    {emoji}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Message metadata (time + read status) for sent messages */}
      {isSent && (
        <View style={styles.sentMeta}>
          <Text style={[styles.timeText, { fontSize: smallFontSize }]}>
            {msg.time}
          </Text>
          {msg.readStatus && (
            <Text style={[styles.readStatus, { fontSize: smallFontSize }]}>
              {msg.readStatus === 'double-check' && '✓✓'}
              {msg.readStatus === 'check' && '✓'}
              {msg.readStatus === 'sent' && '✓'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// MESSAGE ACTIONS MODAL (RESPONSIVE)
// ============================================================================

function MessageActionSheet({ msg, visible, onClose, onAction, screenDimensions }) {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const { screenWidth } = screenDimensions;

  const handleReaction = (emoji) => {
    setSelectedReaction(emoji);
    onAction('react', emoji);
    // Auto-close after reaction
    setTimeout(() => {
      onClose();
      setSelectedReaction(null);
    }, 300);
  };

  if (!msg) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionSheetContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.actionSheetContent}
          >
            {/* Reactions Bar */}
            <View style={styles.reactionsSection}>
              <Text style={[styles.reactionsTitle, { fontSize: responsiveFontSize(12, screenWidth) }]}>
                React
              </Text>
              <View style={styles.reactionsBar}>
                {REACTION_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.reactionBtn,
                      selectedReaction === emoji && styles.reactionBtnActive,
                    ]}
                    onPress={() => handleReaction(emoji)}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: responsiveFontSize(24, screenWidth) }}>
                      {emoji}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.actionDivider} />

            {/* Action Items */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onAction('reply');
                onClose();
              }}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>↖️</Text>
              <Text style={[styles.actionText, { fontSize: responsiveFontSize(15, screenWidth) }]}>
                Reply
              </Text>
              <Text style={[styles.actionArrow, { fontSize: responsiveFontSize(16, screenWidth) }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onAction('forward');
                onClose();
              }}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>⤴️</Text>
              <Text style={[styles.actionText, { fontSize: responsiveFontSize(15, screenWidth) }]}>
                Forward
              </Text>
              <Text style={[styles.actionArrow, { fontSize: responsiveFontSize(16, screenWidth) }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onAction('copy');
                onClose();
              }}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>📋</Text>
              <Text style={[styles.actionText, { fontSize: responsiveFontSize(15, screenWidth) }]}>
                Copy
              </Text>
              <Text style={[styles.actionArrow, { fontSize: responsiveFontSize(16, screenWidth) }]}>›</Text>
            </TouchableOpacity>



            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={[styles.actionItem, styles.deleteAction]}
              onPress={() => {
                onAction('delete');
                onClose();
              }}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>🗑️</Text>
              <Text style={[styles.deleteText, { fontSize: responsiveFontSize(15, screenWidth) }]}>
                Delete
              </Text>
              <Text style={[styles.actionArrow, { fontSize: responsiveFontSize(16, screenWidth) }]}>›</Text>
            </TouchableOpacity>

            <View style={styles.actionSheetSpacer} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ============================================================================
// DELETE MESSAGE MODAL (RESPONSIVE)
// ============================================================================

function DeleteMessageDialog({ visible, onClose, onDeleteForEveryone, onDeleteForMe, screenDimensions }) {
  const [selectedOption, setSelectedOption] = useState('everyone');
  const { screenWidth } = screenDimensions;

  const handleDelete = () => {
    if (selectedOption === 'everyone') {
      onDeleteForEveryone();
    } else {
      onDeleteForMe();
    }
  };

  const isTablet = screenWidth > 768;
  const dialogWidth = isTablet ? Math.min(screenWidth * 0.6, 500) : screenWidth * 0.9;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogBackdrop}>
        <View style={[styles.dialogContainer, { width: dialogWidth }]}>
          <View style={styles.dialogHeader}>
            <Text style={{ fontSize: responsiveFontSize(24, screenWidth) }}>🗑️</Text>
            <Text style={[styles.dialogTitle, { fontSize: responsiveFontSize(18, screenWidth) }]}>
              Delete Message
            </Text>
          </View>

          <Text style={[styles.dialogSubtitle, { fontSize: responsiveFontSize(13, screenWidth) }]}>
            Choose how to delete this message
          </Text>

          {/* Option 1: Delete for Everyone */}
          <TouchableOpacity
            style={[
              styles.deleteOption,
              selectedOption === 'everyone' && styles.deleteOptionSelected,
            ]}
            onPress={() => setSelectedOption('everyone')}
            activeOpacity={0.7}
          >
            <View style={styles.optionRadio}>
              {selectedOption === 'everyone' ? (
                <View style={styles.optionRadioFilled} />
              ) : (
                <View style={styles.optionRadioEmpty} />
              )}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { fontSize: responsiveFontSize(14, screenWidth) }]}>
                Delete for Everyone
              </Text>
              <Text style={[styles.optionSubtitle, { fontSize: responsiveFontSize(12, screenWidth) }]}>
                Message will be removed from all devices (up to 48h)
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Delete for Me Only */}
          <TouchableOpacity
            style={[
              styles.deleteOption,
              selectedOption === 'me' && styles.deleteOptionSelected,
            ]}
            onPress={() => setSelectedOption('me')}
            activeOpacity={0.7}
          >
            <View style={styles.optionRadio}>
              {selectedOption === 'me' ? (
                <View style={styles.optionRadioFilled} />
              ) : (
                <View style={styles.optionRadioEmpty} />
              )}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { fontSize: responsiveFontSize(14, screenWidth) }]}>
                Delete for Me Only
              </Text>
              <Text style={[styles.optionSubtitle, { fontSize: responsiveFontSize(12, screenWidth) }]}>
                Message will only be removed from your device
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info Banner */}
          <View style={styles.dialogInfo}>
            <Text style={{ fontSize: responsiveFontSize(14, screenWidth) }}>⏱️</Text>
            <Text style={[styles.infoText, { fontSize: responsiveFontSize(12, screenWidth) }]}>
              You can only delete for everyone within 48 hours of sending
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={[styles.dialogButtonRow, { flexDirection: isTablet ? 'row' : 'row' }]}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.cancelBtnText, { fontSize: responsiveFontSize(15, screenWidth) }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.deleteBtnText, { fontSize: responsiveFontSize(15, screenWidth) }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// CHAT LOCK MODAL (RESPONSIVE)
// ============================================================================

function ChatLockModal({ visible, onClose, contactName, contactCid, currentPassword, onSave, screenDimensions }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(currentPassword ? 'manage' : 'enter'); // manage, enter, confirm, success
  const { screenWidth } = screenDimensions;

  // Animations
  const contentFade = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(currentPassword ? 'manage' : 'enter');
      setPin('');
      setConfirmPin('');
      contentFade.setValue(1);
    }
  }, [visible, currentPassword]);

  const transitionTo = (nextStep) => {
    Animated.timing(contentFade, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const triggerShake = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = (key) => {
    if (key === 'del') {
      if (step === 'enter') setPin(p => p.slice(0, -1));
      if (step === 'confirm') setConfirmPin(p => p.slice(0, -1));
      return;
    }

    if (step === 'enter') {
      if (pin.length >= 6) return;
      const next = pin + key;
      setPin(next);
      if (next.length === 6) {
        setTimeout(() => transitionTo('confirm'), 200);
      }
    } else if (step === 'confirm') {
      if (confirmPin.length >= 6) return;
      const next = confirmPin + key;
      setConfirmPin(next);
      if (next.length === 6) {
        if (next === pin) {
          // Success
          onSave(next);
          setStep('success');
          setTimeout(() => onClose(), 1500);
        } else {
          triggerShake();
          setConfirmPin('');
        }
      }
    }
  };

  const isTablet = screenWidth > 768;
  const modalWidth = isTablet ? 450 : screenWidth * 0.92;

  // PIN Characters boxes
  const renderPinBoxes = (currentPin) => (
    <View style={styles.premiumPinRow}>
      {Array.from({ length: 6 }).map((_, i) => {
        const filled = i < currentPin.length;
        return (
          <View key={i} style={[styles.premiumPinBox, filled && styles.premiumPinBoxFilled]}>
            <Text style={[styles.premiumPinText, filled && styles.premiumPinTextFilled]}>
              {filled ? '●' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.premiumBackdrop}>
        <Animated.View style={[
          styles.premiumModalCard,
          { width: modalWidth, transform: [{ translateX: shake }, { translateY: 0 }] }
        ]}>
          <View style={styles.premiumModalHeader}>
            <View style={[styles.headerIconCircle, currentPassword && { backgroundColor: COLORS.successLight }]}>
              <Text style={{ fontSize: 24 }}>{currentPassword ? '🛡️' : '🔒'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.premiumModalTitle}>
                {step === 'success' ? 'Password Set!' : (currentPassword && step === 'manage' ? 'Chat Protected' : 'Lock Chat')}
              </Text>
              <Text style={styles.premiumModalSubtitle}>
                {step === 'success' ? 'Your chat is now secure' : 'Private encryption for this contact'}
              </Text>
            </View>
            {step !== 'success' && (
              <TouchableOpacity onPress={onClose} style={styles.premiumCloseBtn}>
                <Text style={{ fontSize: 18, color: COLORS.gray400 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Animated.View style={[styles.premiumModalContent, { opacity: contentFade }]}>
            {step === 'manage' ? (
              <View style={styles.premiumManageBox}>
                <View style={styles.securityBadge}>
                  <Text style={styles.securityBadgeText}>ACTIVE PROTECTION</Text>
                </View>
                <Text style={styles.premiumDesc}>
                  Accessing messages with <Text style={{ fontWeight: '700', color: COLORS.dark }}>{contactName}</Text> requires your private PIN or biometrics.
                </Text>

                <View style={styles.premiumActions}>
                  <TouchableOpacity style={styles.premiumActionBtn} onPress={() => setStep('enter')}>
                    <Text style={styles.premiumActionText}>Change Password</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.premiumActionBtn, styles.dangerActionBtn]} onPress={() => onSave(null)}>
                    <Text style={[styles.premiumActionText, styles.dangerText]}>Remove Lock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : step === 'success' ? (
              <View style={styles.successState}>
                <View style={styles.successCircle}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={styles.successText}>Everything ready</Text>
              </View>
            ) : (
              <View style={styles.premiumPinEntry}>
                <Text style={styles.stepIndicator}>
                  {step === 'enter' ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
                </Text>
                <Text style={styles.pinPromt}>
                  {step === 'enter' ? 'Create your chat PIN' : 'Confirm your chat PIN'}
                </Text>

                {renderPinBoxes(step === 'enter' ? pin : confirmPin)}

                <View style={{ marginTop: 20 }}>
                  <PinPad onKey={handleKey} />
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================================================
// MAIN CHAT MESSAGE SCREEN COMPONENT (RESPONSIVE)
// ============================================================================

export default function ChatMessageScreen({ navigation, route }) {
  // Get screen dimensions for responsive calculations
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { userCID, userNickname, userAvatar, identityPrivKeyRef, contacts } = useCIDContext();

  // Get room info from route params (passed from AddContactByCIDScreen)
  const roomId = route?.params?.chatId;
  const contactName = route?.params?.contactName || 'Chat';
  const contactCID = route?.params?.contactCID;
  const contactAvatarParam = route?.params?.contactAvatar;
  const contactStatus = 'Online';

  // Avatar fallbacks - ensure these are always strings
  const getAvatar = (avatar) => {
    if (avatar && typeof avatar === 'string' && avatar.trim()) {
      return avatar;
    }
    return '👤'; // Default fallback
  };

  const contactAvatar = getAvatar(contactAvatarParam);
  const userAvatarSafe = getAvatar(userAvatar);

  // State management
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showAttachMediaModal, setShowAttachMediaModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);



  // View Once States
  const [viewOncePreviewMsg, setViewOncePreviewMsg] = useState(null);
  const [showViewOncePreview, setShowViewOncePreview] = useState(false);
  const [isViewOnceText, setIsViewOnceText] = useState(false);
  const [isPendingVoiceViewOnce, setIsPendingVoiceViewOnce] = useState(false);

  // Chat Lock States
  const [isLockedOnEntry, setIsLockedOnEntry] = useState(false);
  const [isUnlockedForSession, setIsUnlockedForSession] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [currentLockPassword, setCurrentLockPassword] = useState(null);

  // Audio Recording States
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);

  // E2EE Session Key
  const [sessionKey, setSessionKey] = useState(null);

  useEffect(() => {
    const deriveKey = async () => {
      if (!contactCID || !identityPrivKeyRef.current) return;
      const partner = contacts.find(c => c.cid === contactCID);
      if (partner && partner.publicKey) {
        try {
          const key = await deriveSharedSecret(identityPrivKeyRef.current, partner.publicKey);
          setSessionKey(key);
          console.log("[ChatMessage] E2EE Session Key derived");
        } catch (err) {
          console.error("[ChatMessage] Failed to derive session key:", err);
        }
      }
    };
    deriveKey();
  }, [contacts, contactCID, isFocused]);

  // --- AUTOMATIC DECRYPTION FOR E2EE MEDIA ---
  useEffect(() => {
    if (!sessionKey || messages.length === 0) return;

    const decryptMessages = async () => {
      let needsUpdate = false;
      const updatedMessages = await Promise.all(messages.map(async (msg) => {
        // If it's E2EE, has a media_id, but hasn't been decrypted locally yet
        if (msg.is_e2ee && msg.media_id && !msg.decryptedUri && !msg.isOpened) {
          try {
            console.log(`[ChatMessage] Decrypting E2EE media for message: ${msg.id}`);
            const localUri = await downloadAndDecryptFile(sessionKey, { id: msg.media_id });
            if (localUri) {
              needsUpdate = true;
              const decryptedMsg = {
                ...msg,
                decryptedUri: localUri,
                // Override the display URIs with the decrypted local version
                image: (msg.type === 'image' || msg.originalType === 'image') ? localUri : msg.image,
                videoUri: (msg.type === 'video' || msg.originalType === 'video') ? localUri : msg.videoUri,
                fileUri: (msg.type === 'file' || msg.originalType === 'file') ? localUri : msg.fileUri,
                voiceUri: (msg.type === 'voice' || msg.originalType === 'voice') ? localUri : msg.voiceUri,
              };

              // Auto-save to vault once decrypted (skip view-once)
              if (!msg.isViewOnce) {
                saveToVault(decryptedMsg, msg.id);
              }

              return decryptedMsg;
            }
          } catch (err) {
            console.error(`[ChatMessage] Failed to decrypt message ${msg.id}:`, err);
          }
        }
        return msg;
      }));

      if (needsUpdate) {
        setMessages(updatedMessages);
      }
    };

    decryptMessages();
  }, [messages, sessionKey]);

  const flatListRef = useRef(null);
  const messagesRef = useRef([]);
  const messageListenerRef = useRef(null);

  // Initialize room and load history
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;

    const initialize = async () => {


      // 2. Load from local storage immediately for fast UI
      const localMsgs = await messageStorage.getMessages(roomId);
      if (isMounted && localMsgs.length > 0) {
        const formatted = localMsgs.map(m => formatSocketMsg(m));
        setMessages(formatted);
      }

      // 2. Ensure socket is ready and joined
      try {
        await socketService.waitForConnection();
        await socketService.joinRoom(roomId);

        // 3. Sync with server for any missed messages
        const history = await socketService.getChatHistory(roomId);
        if (history && history.messages && isMounted) {
          const formatted = history.messages.map(m => formatSocketMsg(m));
          setMessages(formatted);
          // Save to local storage (duplicates handled by saveMessage)
          for (const m of history.messages) {
            await messageStorage.saveMessage(roomId, m);
          }
        }
      } catch (err) {
        console.warn("[ChatMessage] Sync/Join failed:", err);
      }
    };

    // 1. Check for Chat Lock on entry
    const checkLockEffect = async () => {
      if (contactCID && !isUnlockedForSession) {
        const status = await getChatLockStatus(contactCID);
        if (status.isLocked) {
          setIsLockedOnEntry(true);
          setCurrentLockPassword(status.lockPassword);
          // Navigate to Unlock screen
          navigation.navigate('UnlockChat', {
            contactName,
            contactCid: contactCID,
            onUnlockSuccess: () => {
              setIsLockedOnEntry(false);
              setIsUnlockedForSession(true);
              navigation.goBack();
            }
          });
        }
      }
    };

    checkLockEffect();
    initialize();

    // 4. Subscribe to new messages using multiplexed listener
    const unsubReceived = socketService.on("message:received", (message) => {
      if (isMounted && message.roomId === roomId) {
        const newMsg = formatSocketMsg(message);
        setMessages(prev => {
          // 1. Precise Deduplication
          if (prev.find(m => m.id === newMsg.id)) return prev;

          // 2. Optimistic Echo Handling
          if (newMsg.sender === 'sent') {
            let tempIndex = -1;
            for (let i = prev.length - 1; i >= 0; i--) {
              const m = prev[i];
              if (
                m.id.startsWith('temp-') &&
                m.type === newMsg.type &&
                m.text === newMsg.text
              ) {
                tempIndex = i;
                break;
              }
            }
            if (tempIndex !== -1) {
              const next = [...prev];
              next[tempIndex] = { ...newMsg, createdAt: newMsg.createdAt || Date.now() };
              return next;
            }
          }
          return [...prev, newMsg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // ── Auto-save RECEIVED (from others) media to Vault ──
        const isFromOther = message.senderCid !== userCID;
        const msgData = message.message && typeof message.message === 'object' ? message.message : null;
        if (isFromOther && msgData && ['image', 'video', 'file', 'voice'].includes(msgData.type)) {
          if (!msgData.isViewOnce) {
            saveToVault({ ...message, ...msgData }, message.id);
          }
        }
      }
    });

    const unsubDeleted = socketService.on("message:deleted", (data) => {
      if (isMounted && data.roomId === roomId) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    });

    const unsubReact = socketService.on("message:reaction:updated", (data) => {
      if (isMounted && data.roomId === roomId) {
        setMessages(prev => prev.map(m => {
          if (m.id === data.messageId) {
            let reactions = [...(m.reactions || [])];
            if (data.action === 'add' && !reactions.includes(data.emoji)) {
              reactions.push(data.emoji);
            } else if (data.action === 'remove' && reactions.includes(data.emoji)) {
              reactions = reactions.filter(r => r !== data.emoji);
            }
            return { ...m, reactions };
          }
          return m;
        }));
      }
    });

    const unsubOpened = socketService.on("message:opened", (data) => {
      if (isMounted && data.roomId === roomId) {
        setMessages(prev => prev.map(m => {
          if (m.id === data.messageId) {
            return {
              ...m,
              isOpened: true,
              image: null,
              videoUri: null,
              fileUri: null,
              voiceUri: null,
              text: null
            };
          }
          return m;
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubReceived();
      unsubDeleted();
      unsubReact();
      unsubOpened();
    };
  }, [roomId, navigation]);





  // Helper to format socket message to UI message
  const formatSocketMsg = (message) => {
    const isSent = userCID === message.senderCid;
    const msgData = message.message;

    // Check if message is an object (media) or string (text)
    const isMedia = msgData && typeof msgData === 'object';
    const isImage = isMedia && msgData.type === 'image';
    const isFile = isMedia && msgData.type === 'file';
    const isVoice = isMedia && msgData.type === 'voice';
    const isVideo = isMedia && msgData.type === 'video';
    const isViewOnce = isMedia && (msgData.type === 'view-once' || msgData.isViewOnce);

    // If it's view-once, the content type is inside the object
    // Normalizing 'photo' -> 'image' for internal consistency
    let actualType = isViewOnce ? (msgData.originalType || 'image') : (isImage ? 'image' : (isVoice ? 'voice' : (isVideo ? 'video' : (isFile ? 'file' : 'text'))));
    if (actualType === 'photo') actualType = 'image';

    const isOpened = message.isOpened || (isMedia && msgData.isOpened);

    return {
      id: message.id,
      sender: isSent ? 'sent' : 'received',
      text: (isViewOnce && actualType === 'text') ? (isOpened ? null : (msgData.text || '')) : ((isImage || isFile || isVoice || isVideo || (isViewOnce && actualType !== 'text')) ? '' : (typeof msgData === 'object' ? msgData.text : msgData)),
      image: !isOpened && (isImage || (isViewOnce && actualType === 'image')) ? msgData.uri || msgData.image || msgData.photo : null,
      fileUri: !isOpened && (isFile || (isViewOnce && actualType === 'file')) ? msgData.uri || msgData.fileUri : null,
      fileName: isFile || (isViewOnce && actualType === 'file') ? msgData.name : null,
      fileSize: isFile || (isViewOnce && actualType === 'file') ? msgData.size : null,
      mimeType: isFile || (isViewOnce && actualType === 'file') ? msgData.mimeType : null,
      voiceUri: !isOpened && (isVoice || (isViewOnce && actualType === 'voice')) ? msgData.uri || msgData.voiceUri : null,
      duration: isVoice || (isViewOnce && actualType === 'voice') ? msgData.duration : null,
      videoUri: !isOpened && (isVideo || (isViewOnce && actualType === 'video')) ? msgData.uri || msgData.videoUri : null,
      time: new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: message.createdAt ||
        (message.timestamp ? new Date(message.timestamp).getTime() : Date.now()),
      type: isViewOnce ? 'view-once' : actualType,
      originalType: actualType,
      isViewOnce: isViewOnce,
      isOpened: isOpened,
      reactions: message.reactions || [],
      readStatus: isSent ? 'delivered' : undefined,
      isForwarded: false,
      senderCid: message.senderCid,
      senderNickname: message.senderNickname || `User-${message.senderCid?.substring(0, 4) || '?'}`,
      avatar: message.senderAvatar || (message.senderCid !== userCID ? contactAvatar : userAvatarSafe),
      timerMs: message.timerMs || (isMedia && msgData.timerMs),
      expiresAt: message.expiresAt || (isMedia && msgData.expiresAt) ||
        ((message.timerMs || (isMedia && msgData.timerMs)) ? (Date.now() + (message.timerMs || msgData.timerMs)) : null),
      is_e2ee: message.is_e2ee || (isMedia && msgData.is_e2ee),
      media_id: message.media_id || (isMedia && msgData.media_id),
    };
  };

  // ─── Vault Auto-Save Helper ───────────────────────────────────────
  /**
   * Save a media message to the vault.
   * Called whenever media is sent or received.
   * Works silently in the background — no UI interruption.
   */
  const saveToVault = async (msg, msgId) => {
    try {
      const type = msg.type || (msg.message && typeof msg.message === 'object' ? msg.message.type : null);
      const mediaTypes = ['image', 'video', 'file', 'voice'];
      if (!mediaTypes.includes(type)) return;

      // Extract the URI / data from various message shapes
      const msgData = msg.message && typeof msg.message === 'object' ? msg.message : msg;
      const isImage = type === 'image' || (msgData.originalType === 'photo');
      
      // For E2EE messages, we MUST use the decrypted local URI
      const isE2EE = msg.is_e2ee || msgData.is_e2ee;
      const uri = isE2EE 
        ? (msg.decryptedUri || msgData.decryptedUri) 
        : (msgData.uri || msgData.image || msg.image || msg.videoUri || msg.fileUri || msg.voiceUri);
      
      if (!uri) {
        if (isE2EE) console.log("[ChatMessage] Skipping vault save for E2EE item (not yet decrypted)");
        return;
      }

      const vaultType = isImage ? 'image' : type;
      const name = msgData.name || msg.fileName || (type === 'image' ? 'photo.jpg' : type === 'video' ? 'video.mp4' : type === 'voice' ? 'voice.m4a' : 'file');
      const mimeType = msgData.mimeType || msg.mimeType || (type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : type === 'voice' ? 'audio/m4a' : 'application/octet-stream');

      await vaultStorage.saveVaultItem({
        id: msgId || msg.id || ('vault-' + Date.now()),
        type: vaultType,
        uri,
        name,
        size: msgData.size || msg.fileSize || 0,
        mimeType,
        roomId,
        senderNickname: msg.senderNickname || userNickname,
      });
    } catch (err) {
      // Silent — vault save should never crash the chat
      console.warn('[ChatMessage] Vault save failed:', err);
    }
  };

  // Screen dimensions object for passing to child components
  const screenDimensions = { screenWidth, screenHeight };

  // Responsive sizing calculations
  const isTablet = screenWidth > 768;
  const headerPaddingHorizontal = screenWidth > 600 ? SPACING.xl : SPACING.lg;
  const headerHeight = responsiveSize(60, screenWidth);

  // Handle message selection for multi-select
  const handleSelectMessage = (msgId) => {
    if (!multiSelectMode) {
      setMultiSelectMode(true);
      setSelectedMessages([msgId]);
    } else {
      setSelectedMessages((prev) =>
        prev.includes(msgId)
          ? prev.filter((id) => id !== msgId)
          : [...prev, msgId]
      );
    }
  };

  // Exit multi-select mode
  const exitMultiSelectMode = () => {
    setMultiSelectMode(false);
    setSelectedMessages([]);
  };

  // Handle long press on message
  const handleMessageLongPress = (msg) => {
    setSelectedMsg(msg);
    setShowActionSheet(true);
  };

  // Handle actions from action sheet
  const handleAction = (action, value) => {
    switch (action) {
      case 'react':
        // Toggle reaction properly over the network
        if (selectedMsg && roomId) {
          const hasReacted = selectedMsg.reactions && selectedMsg.reactions.includes(value);
          const reactAction = hasReacted ? 'remove' : 'add';
          socketService.toggleReaction(roomId, selectedMsg.id, value, reactAction);
          // UI state updates via optimistic hook below (optional) or wait for round trip
          // In this case, since the server echoes, we'll let the event listener update the state!
        }
        break;

      case 'delete':
        setShowDeleteDialog(true);
        break;

      case 'reply':
        if (selectedMsg && selectedMsg.text) {
          setInputText(`> ${selectedMsg.text}\n\n`);
        }
        break;

      case 'copy':
        if (selectedMsg && selectedMsg.text) {
          // In real app, use Clipboard.setString(selectedMsg.text)
          console.log('Copied:', selectedMsg.text);
          alert('✓ Message copied to clipboard');
        }
        break;





      case 'forward':
        // Pass message details to forward screen
        navigation.navigate('Forward', {
          message: selectedMsg,
          onForwardComplete: (recipientCount) => {
            // Mark message as forwarded
            if (selectedMsg) {
              setMessages((prevMsgs) =>
                prevMsgs.map((msg) =>
                  msg.id === selectedMsg.id
                    ? { ...msg, isForwarded: true }
                    : msg
                )
              );
            }
          }
        });
        break;

      default:
        break;
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!roomId) return;

    const messageText = inputText.trim();
    const isViewOnce = isViewOnceText;

    // Add to UI immediately
    const tempMsg = {
      id: "temp-" + Date.now(),
      sender: 'sent',
      text: isViewOnce ? 'Sent a view-once message' : messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(), // CRITICAL for cleanup interval
      type: isViewOnce ? 'view-once' : 'text',
      originalType: 'text',
      isViewOnce: isViewOnce,
      readStatus: 'sending',
      avatar: userAvatarSafe,
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setIsViewOnceText(false); // Reset
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {


      const payload = {
        type: isViewOnce ? 'view-once' : 'text',
        originalType: 'text',
        isViewOnce: isViewOnce,
        text: messageText,
      };

      socketService.sendMessage(roomId, payload, userNickname, userAvatarSafe);
    } catch (error) {
      console.error("[ChatMessage] Error sending message:", error);
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (type) => {
    if (selectedMsg && roomId) {
      if (type === 'everyone') {
        socketService.deleteMessage(roomId, selectedMsg.id);
      }

      // Delete from local storage
      await messageStorage.deleteMessage(roomId, selectedMsg.id);

      setMessages((prevMsgs) =>
        prevMsgs.filter((msg) => msg.id !== selectedMsg.id)
      );
      setSelectedMsg(null);
      setShowDeleteDialog(false);
      // alert(`Message deleted ${type === 'everyone' ? 'for everyone' : 'for you'}`);
    }
  };

  // Delete multiple selected messages
  const handleDeleteMultiple = async () => {
    if (roomId) {
      for (const msgId of selectedMessages) {
        await messageStorage.deleteMessage(roomId, msgId);
      }
    }
    setMessages((prevMsgs) =>
      prevMsgs.filter((msg) => !selectedMessages.includes(msg.id))
    );
    exitMultiSelectMode();
    alert('Messages deleted for you');
  };

  // Handle media attachment selection
  const handleClearRoomMedia = async () => {
    Alert.alert(
      "Clear Room Media",
      "Are you sure you want to permanently delete all images, videos, and voice notes in this chat? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Media",
          style: "destructive",
          onPress: async () => {
            try {
              const deletedCount = await messageStorage.clearRoomMedia(roomId);
              if (deletedCount > 0) {
                // Refresh messages from storage to reflect the "[Media Deleted]" state
                const refreshed = await messageStorage.getMessages(roomId);
                setMessages(refreshed.map(m => formatSocketMsg(m)));
                alert(`Purged ${deletedCount} media items.`);
              } else {
                alert("No media items found to clear.");
              }
            } catch (error) {
              console.error("[ChatMessage] Error clearing media:", error);
              alert("Failed to clear media.");
            }
          }
        }
      ]
    );
  };

  const handleMediaAttach = async (mediaInfo) => {
    console.log('Media selected:', mediaInfo);
    const isViewOnce = mediaInfo.isViewOnce;

    try {
      if (mediaInfo.type === 'image') {
        const asset = await mediaService.pickImage();
        if (asset) {
          handleSendImage(asset, isViewOnce);
        }
      } else if (mediaInfo.type === 'file') {
        const asset = await mediaService.pickDocument();
        if (asset) {
          handleSendFile(asset, isViewOnce);
        }
      } else if (mediaInfo.type === 'voice') {
        setIsPendingVoiceViewOnce(isViewOnce);
        handleStartRecording();
      } else if (mediaInfo.type === 'video') {
        const asset = await mediaService.pickVideo();
        if (asset) {
          handleSendVideo(asset, isViewOnce);
        }
      } else {
        const mediaTypeEmojis = {
          timer: '⏱️',
        };
        const emoji = mediaTypeEmojis[mediaInfo.type] || '📎';
        alert(`✓ Ready to send ${mediaInfo.label}\n${emoji}`);
      }
    } catch (err) {
      console.error("[ChatMessage] Media selection error:", err);
    }
  };

  const handleSendVideo = async (asset, isViewOnce = false) => {
    try {
      if (!roomId) return;

      // 0. Add optimistic message to UI
      const tempId = "temp-" + Date.now();
      const tempMsg = {
        id: tempId,
        sender: 'sent',
        text: isViewOnce ? 'Sent a view-once video' : 'Sent a video',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        type: isViewOnce ? 'view-once' : 'video',
        originalType: 'video',
        isViewOnce: isViewOnce,
        readStatus: 'sending',
        videoUri: asset.uri, // Show local version while uploading
        avatar: userAvatarSafe,
      };
      setMessages(prev => [...prev, tempMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      setIsUploading(true);
      setUploadProgress(0);

      // 1. Compress video
      const compressedUri = await mediaService.compressVideo(asset.uri, (progress) => {
        setUploadProgress(Math.round(progress * 20)); // First 20% for compression
      });

      let uploadResult;
      if (sessionKey) {
        // --- E2EE FLOW ---
        console.log("[ChatMessage] Using E2EE for video upload");
        uploadResult = await uploadE2EEFile(
          sessionKey,
          userCID,
          contactCID,
          roomId,
          compressedUri,
          asset.fileSize || asset.size || 0,
          (p) => setUploadProgress(20 + Math.round(p * 0.8))
        );
      } else {
        // --- REGULAR FLOW ---
        const fileToUpload = {
          uri: compressedUri,
          name: asset.fileName || `video-${Date.now()}.mp4`,
          type: 'video/mp4',
          size: asset.fileSize || asset.size,
        };

        const isLarge = fileToUpload.size > 50 * 1024 * 1024;
        if (isLarge) {
          uploadResult = await mediaService.uploadLargeFile(fileToUpload, userCID, (p) => {
            setUploadProgress(20 + Math.round(p * 0.8));
          });
        } else {
          uploadResult = await mediaService.uploadFile(fileToUpload, userCID, (p) => {
            setUploadProgress(20 + Math.round(p * 0.8));
          });
        }

        await mediaService.saveMetadata({
          ...uploadResult,
          sender_id: userCID,
        }, roomId);
      }

      // 4. Send via socket
      socketService.sendMessage(roomId, {
        id: tempId, // Pass tempId to avoid duplicates
        type: isViewOnce ? 'view-once' : 'video',
        originalType: 'video',
        isViewOnce: isViewOnce,
        videoUri: uploadResult.fileUrl,
        text: isViewOnce ? 'Sent a view-once video' : 'Sent a video',
        is_e2ee: !!sessionKey,
        media_id: uploadResult.id,
      }, userNickname, userAvatarSafe);

      setIsUploading(false);
      setUploadProgress(0);
    } catch (err) {
      console.error("[ChatMessage] Video Upload Error:", err);
      setIsUploading(false);
      alert("Failed to upload video");
    }
  };


  const handleSendFile = async (asset, isViewOnce = false) => {
    try {
      if (!roomId) return;

      // 0. Add optimistic message to UI
      const tempId = "temp-" + Date.now();
      const tempMsg = {
        id: tempId,
        sender: 'sent',
        text: isViewOnce ? `Sent a view-once file: ${asset.name}` : `Sent a file: ${asset.name}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        type: isViewOnce ? 'view-once' : 'file',
        originalType: 'file',
        isViewOnce: isViewOnce,
        readStatus: 'sending',
        fileUri: asset.uri,
        fileName: asset.name,
        fileSize: asset.size,
        mimeType: asset.mimeType,
        avatar: userAvatarSafe,
      };
      setMessages(prev => [...prev, tempMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      setIsUploading(true);
      setUploadProgress(0);

      let uploadResult;
      if (sessionKey) {
        // --- E2EE FLOW ---
        console.log("[ChatMessage] Using E2EE for file upload");
        uploadResult = await uploadE2EEFile(
          sessionKey,
          userCID,
          contactCID,
          roomId,
          asset.uri,
          asset.size || 0,
          (p) => setUploadProgress(p)
        );
      } else {
        // --- REGULAR FLOW ---
        const fileToUpload = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        };

        uploadResult = await mediaService.uploadFile(fileToUpload, userCID, (p) => {
          setUploadProgress(p);
        });

        await mediaService.saveMetadata({
          ...uploadResult,
          sender_id: userCID,
        }, roomId);
      }

      // 3. Send via socket
      socketService.sendMessage(roomId, {
        id: tempId, // Pass tempId
        type: isViewOnce ? 'view-once' : 'file',
        originalType: 'file',
        isViewOnce: isViewOnce,
        fileUri: uploadResult.fileUrl,
        fileName: asset.name,
        fileSize: asset.size,
        mimeType: asset.mimeType,
        text: isViewOnce ? `Sent a view-once file: ${asset.name}` : `Sent a file: ${asset.name}`,
        is_e2ee: !!sessionKey,
        media_id: uploadResult.id,
      }, userNickname, userAvatarSafe);

      // ── Save to Vault (non-view-once only) ────────────────────
      if (!isViewOnce) {
        const vaultId = 'vault-file-' + Date.now();
        saveToVault({
          id: vaultId,
          type: 'file',
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
          senderNickname: userNickname,
        }, vaultId);
      }

      setIsUploading(false);
      setUploadProgress(0);
    } catch (err) {
      console.error("[ChatMessage] File Upload Error:", err);
      setIsUploading(false);
      alert("Failed to upload file");
    }
  };

  const handleOpenFile = async (msg) => {
    try {
      let uri = msg.fileUri;
      if (!uri) return;

      // If the URI is a data URI (base64), we need to save it to a file first
      if (uri.startsWith('data:')) {
        const parts = uri.split(',');
        const base64Content = parts[1];
        const filename = msg.fileName || 'document.pdf';
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, base64Content, {
          encoding: 'base64',
        });
        uri = fileUri;
      }

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: msg.mimeType || 'application/pdf',
        });
      } else {
        // iOS: Sharing handles "Open In" correctly
        await Sharing.shareAsync(uri);
      }
    } catch (err) {
      console.error("[ChatMessage] Error opening file:", err);
      // Fallback to sharing if direct opening fails
      try {
        await Sharing.shareAsync(msg.fileUri);
      } catch (shareErr) {
        alert("Could not open file");
      }
    }
  };

  const handleSendImage = async (asset, isViewOnce = false) => {
    if (!roomId) return;

    try {
      // 0. Add optimistic message to UI
      const tempId = "temp-" + Date.now();
      const tempMsg = {
        id: tempId,
        sender: 'sent',
        text: isViewOnce ? 'Sent a view-once photo' : 'Sent a photo',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        type: isViewOnce ? 'view-once' : 'image',
        originalType: 'image',
        isViewOnce: isViewOnce,
        readStatus: 'sending',
        image: asset.uri,
        avatar: userAvatarSafe,
      };
      setMessages(prev => [...prev, tempMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      setIsUploading(true);
      setUploadProgress(0);

      // 1. Compress image
      const compressedUri = await mediaService.compressImage(asset.uri);

      let uploadResult;
      if (sessionKey) {
        // --- E2EE FLOW ---
        console.log("[ChatMessage] Using E2EE for image upload");
        uploadResult = await uploadE2EEFile(
          sessionKey,
          userCID,
          contactCID,
          roomId,
          compressedUri,
          asset.fileSize || asset.size || 0,
          (p) => setUploadProgress(p)
        );
      } else {
        // --- REGULAR FLOW (Fallback) ---
        const fileToUpload = {
          uri: compressedUri,
          name: asset.fileName || `photo-${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || asset.size || 0,
        };

        uploadResult = await mediaService.uploadFile(fileToUpload, userCID, (p) => {
          setUploadProgress(p);
        });

        await mediaService.saveMetadata({
          ...uploadResult,
          sender_id: userCID,
        }, roomId);
      }

      // 4. Send via socket
      socketService.sendMessage(roomId, {
        id: tempId, // Pass tempId
        type: isViewOnce ? 'view-once' : 'image',
        originalType: 'image',
        isViewOnce: isViewOnce,
        image: uploadResult.fileUrl,
        text: isViewOnce ? 'Sent a view-once photo' : 'Sent a photo',
        is_e2ee: !!sessionKey, // Mark as E2EE
        media_id: uploadResult.id, // For metadata lookup
      }, userNickname, userAvatarSafe);

      // ── Save to Vault (non-view-once only) ────────────────────
      if (!isViewOnce) {
        const vaultId = 'vault-img-' + Date.now();
        saveToVault({
          id: vaultId,
          type: 'image',
          uri: asset.uri,
          name: 'photo.jpg',
          mimeType: 'image/jpeg',
          senderNickname: userNickname,
        }, vaultId);
      }

      setIsUploading(false);
      setUploadProgress(0);
    } catch (err) {
      console.error("[ChatMessage] Send Image Error:", err);
      setIsUploading(false);
      alert("Failed to upload image");
    }
  };

  // --- AUDIO LOGIC ---
  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert("Microphone permission is required to record voice messages.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };



  const formattedDuration = () => {
    const mins = Math.floor(recordingDuration / 60);
    const secs = recordingDuration % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCancelRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recording) {
      setRecording(null);
      await recording.stopAndUnloadAsync();
    }
    setRecordingDuration(0);
  };

  // --- VIEW ONCE LOGIC ---
  const handleOpenViewOnce = (msg) => {
    if (msg.isOpened) return;
    console.log('[ViewOnce] Opening message:', msg.id, 'Type:', msg.originalType);
    console.log('[ViewOnce] Media URI:', msg.image || msg.videoUri || msg.voiceUri || msg.fileUri || 'NONE');
    setViewOncePreviewMsg(msg);
    setShowViewOncePreview(true);
  };

  // Keep view-once preview in sync with background decryption
  useEffect(() => {
    if (showViewOncePreview && viewOncePreviewMsg) {
      const updated = messages.find(m => m.id === viewOncePreviewMsg.id);
      if (updated && updated.decryptedUri && !viewOncePreviewMsg.decryptedUri) {
        setViewOncePreviewMsg(updated);
      }
    }
  }, [messages, showViewOncePreview, viewOncePreviewMsg]);

  const handleCloseViewOnce = async () => {
    if (viewOncePreviewMsg) {
      const msgId = viewOncePreviewMsg.id;

      // Notify server and peer
      socketService.messageOpened(roomId, msgId);

      // Update local storage
      await messageStorage.markMessageAsOpened(roomId, msgId);

      // Update local state
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            isOpened: true,
            image: null,
            videoUri: null,
            fileUri: null,
            voiceUri: null
          };
        }
        return m;
      }));
    }

    setShowViewOncePreview(false);
    setViewOncePreviewMsg(null);
  };

  const handleStopAndSendRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    if (!recording) return;

    setRecording(null);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const finalDuration = formattedDuration();

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) return;

      // 1. Upload to S3
      setIsUploading(true);
      setUploadProgress(0);

      let uploadResult;
      if (sessionKey) {
        // --- E2EE FLOW ---
        console.log("[ChatMessage] Using E2EE for voice upload");
        uploadResult = await uploadE2EEFile(
          sessionKey,
          userCID,
          contactCID,
          roomId,
          uri,
          0, // Voice recording size unknown until after upload or check
          (p) => setUploadProgress(p)
        );
      } else {
        // --- REGULAR FLOW ---
        const fileToUpload = {
          uri: uri,
          name: `voice-${Date.now()}.m4a`,
          type: 'audio/m4a',
          size: 0,
        };

        uploadResult = await mediaService.uploadFile(fileToUpload, userCID, (p) => {
          setUploadProgress(p);
        });

        await mediaService.saveMetadata({
          ...uploadResult,
          sender_id: userCID,
        }, roomId);
      }

      // 3. Send via socket
      const isViewOnce = isPendingVoiceViewOnce;
      socketService.sendMessage(roomId, {
        id: 'voice-' + Date.now(), // Generate a stable temp ID for voice
        type: isViewOnce ? 'view-once' : 'voice',
        originalType: 'voice',
        isViewOnce: isViewOnce,
        voiceUri: uploadResult.fileUrl,
        duration: finalDuration,
        text: isViewOnce ? 'Sent a view-once voice message' : 'Sent a voice message',
        is_e2ee: !!sessionKey,
        media_id: uploadResult.id,
      }, userNickname, userAvatarSafe);

      // ── Save voice to Vault ───────────────────────────────────
      const vaultId = 'vault-voice-' + Date.now();
      saveToVault({
        id: vaultId,
        type: 'voice',
        uri,
        name: `voice_${vaultId}.m4a`,
        mimeType: 'audio/m4a',
        senderNickname: userNickname,
      }, vaultId);

    } catch (err) {
      console.error('Failed to stop and send recording', err);
    }
    setRecordingDuration(0);
  };

  // Responsive header styling
  const headerBackArrowFontSize = responsiveFontSize(20, screenWidth);
  const contactNameFontSize = responsiveFontSize(15, screenWidth);
  const contactStatusFontSize = responsiveFontSize(12, screenWidth);
  const headerIconFontSize = responsiveFontSize(18, screenWidth);

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* ===== HEADER ===== */}
        {multiSelectMode ? (
          // Multi-select header
          <View style={[styles.multiSelectHeader, { paddingHorizontal: headerPaddingHorizontal }]}>
            <TouchableOpacity
              onPress={exitMultiSelectMode}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: headerBackArrowFontSize }}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.multiSelectTitle, { fontSize: responsiveFontSize(15, screenWidth) }]}>
              {selectedMessages.length} selected
            </Text>
            <View style={styles.multiSelectActions}>
              <TouchableOpacity
                style={styles.multiSelectActionBtn}
                onPress={() => {
                  // Forward multiple messages
                  alert('Forward selected messages');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>⤴️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.multiSelectActionBtn, styles.deleteActionBtn]}
                onPress={handleDeleteMultiple}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Normal header
          <View style={[styles.header, { paddingHorizontal: headerPaddingHorizontal }]}>
            <TouchableOpacity
              onPress={() => navigation?.goBack?.()}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: headerBackArrowFontSize }}>‹</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.avatarContainer}>
                <View style={[
                  styles.contactAvatar,
                  {
                    width: responsiveSize(40, screenWidth),
                    height: responsiveSize(40, screenWidth),
                    borderRadius: responsiveSize(20, screenWidth),
                    overflow: 'hidden',
                  }
                ]}>
                  {contactAvatar && (contactAvatar.startsWith('http') || contactAvatar.startsWith('file') || contactAvatar.startsWith('content')) ? (
                    <Image
                      source={{ uri: contactAvatar }}
                      style={{ width: responsiveSize(40, screenWidth), height: responsiveSize(40, screenWidth) }}
                    />
                  ) : (
                    <Text style={{ fontSize: responsiveFontSize(20, screenWidth) }}>
                      {contactAvatar}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.onlineIndicator,
                  {
                    width: responsiveSize(12, screenWidth),
                    height: responsiveSize(12, screenWidth),
                    borderRadius: responsiveSize(6, screenWidth),
                  }
                ]} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { fontSize: contactNameFontSize }]}>
                  {contactName}
                </Text>
                <Text style={[styles.contactStatus, { fontSize: contactStatusFontSize }]}>
                  ● {contactStatus}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                activeOpacity={0.6}
                onPress={() => setShowLockModal(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>{currentLockPassword ? '🔓' : '🔒'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerIconBtn}
                activeOpacity={0.6}
                onPress={() => alert('Voice call initiated')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>☎️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconBtn}
                activeOpacity={0.6}
                onPress={() => alert('Video call initiated')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>📹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerIconBtn}
                activeOpacity={0.6}
                onPress={handleClearRoomMedia}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>🧹</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== ENCRYPTION INFO BANNER ===== */}
        <View style={[styles.encryptionBanner, { marginHorizontal: headerPaddingHorizontal }]}>
          <Text style={{ fontSize: responsiveFontSize(16, screenWidth) }}>🔐</Text>
          <Text style={[
            styles.encryptionText,
            { fontSize: responsiveFontSize(12, screenWidth) }
          ]}>
            AES-256 · E2E Encrypted · PFS
          </Text>
          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={() => alert('Show encryption details')}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.verifyText, { fontSize: responsiveFontSize(12, screenWidth) }]}>
              Verify
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===== MESSAGES LIST ===== */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              onLongPress={handleMessageLongPress}
              onReplyPress={() => { }}
              isSelected={multiSelectMode ? selectedMessages.includes(item.id) : undefined}
              onSelect={multiSelectMode ? handleSelectMessage : undefined}
              screenDimensions={screenDimensions}
              onImagePress={(uri) => {
                setPreviewImage(uri);
                setShowPreviewModal(true);
              }}
              onFilePress={handleOpenFile}
              onViewOncePress={handleOpenViewOnce}
            />
          )}
          contentContainerStyle={[
            styles.messagesList,
            { paddingHorizontal: headerPaddingHorizontal }
          ]}
          scrollEnabled
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { fontSize: responsiveFontSize(15, screenWidth) }]}>
                No messages yet. Start chatting! 👋
              </Text>
            </View>
          }
        />

        {/* ===== INPUT AREA ===== */}
        {!multiSelectMode && (
          <View style={[
            styles.inputArea,
            {
              paddingHorizontal: responsiveSize(12, screenWidth),
              paddingBottom: SPACING.md,
            }
          ]}>
            {isUploading && (
              <View style={styles.uploadProgressContainer}>
                <Text style={styles.uploadProgressText}>Uploading: {uploadProgress}%</Text>
                <View style={styles.uploadProgressBar}>
                  <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
                </View>
              </View>
            )}

            {recording ? (
              <View style={styles.recordingInterface}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTimerText}>{formattedDuration()}</Text>

                <TouchableOpacity onPress={handleCancelRecording} style={styles.cancelRecBtn}>
                  <Text style={styles.cancelRecText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleStopAndSendRecording} style={styles.sendRecBtn}>
                  <Text style={{ fontSize: responsiveFontSize(16, screenWidth) }}>⬆️</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.attachBtn,
                    {
                      width: responsiveSize(36, screenWidth),
                      height: responsiveSize(36, screenWidth),
                      borderRadius: responsiveSize(18, screenWidth),
                    }
                  ]}
                  activeOpacity={0.6}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowAttachMediaModal(true);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>📎</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.viewOnceBtn,
                    isViewOnceText && styles.viewOnceBtnActive,
                    {
                      width: responsiveSize(36, screenWidth),
                      height: responsiveSize(36, screenWidth),
                      borderRadius: responsiveSize(18, screenWidth),
                      marginLeft: 4,
                    }
                  ]}
                  activeOpacity={0.6}
                  onPress={() => setIsViewOnceText(!isViewOnceText)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>
                    {isViewOnceText ? '👁️‍🗨️' : '👁️'}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={[
                    styles.input,
                    {
                      fontSize: responsiveFontSize(15, screenWidth),
                      paddingHorizontal: responsiveSize(12, screenWidth),
                      paddingVertical: responsiveSize(8, screenWidth),
                      borderRadius: responsiveSize(12, screenWidth),
                      minHeight: responsiveSize(40, screenWidth),
                      maxHeight: responsiveSize(100, screenWidth),
                    }
                  ]}
                  placeholder="Message..."
                  placeholderTextColor={COLORS.gray400}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  editable={true}
                  selectTextOnFocus={true}
                />

                {inputText.trim() ? (
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      {
                        width: responsiveSize(36, screenWidth),
                        height: responsiveSize(36, screenWidth),
                        borderRadius: responsiveSize(18, screenWidth),
                      }
                    ]}
                    onPress={handleSendMessage}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: responsiveFontSize(18, screenWidth), color: COLORS.white }}>
                      ➤
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.micBtn,
                      {
                        width: responsiveSize(36, screenWidth),
                        height: responsiveSize(36, screenWidth),
                        borderRadius: responsiveSize(18, screenWidth),
                      }
                    ]}
                    onPress={handleStartRecording}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>🎤</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* ===== ACTION SHEET ===== */}
        <MessageActionSheet
          msg={selectedMsg}
          visible={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          onAction={handleAction}
          screenDimensions={screenDimensions}
        />

        {/* ===== DELETE DIALOG ===== */}
        <DeleteMessageDialog
          visible={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onDeleteForEveryone={() => handleDeleteMessage('everyone')}
          onDeleteForMe={() => handleDeleteMessage('me')}
          screenDimensions={screenDimensions}
        />

        {/* ===== ATTACH MEDIA MODAL ===== */}
        <AttachMediaModal
          visible={showAttachMediaModal}
          onClose={() => setShowAttachMediaModal(false)}
          onSelectMedia={handleMediaAttach}
        />



        {/* ===== IMAGE PREVIEW MODAL ===== */}
        <Modal
          visible={showPreviewModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPreviewModal(false)}
        >
          <TouchableOpacity
            style={styles.previewBackdrop}
            activeOpacity={1}
            onPress={() => setShowPreviewModal(false)}
          >
            <SafeAreaView style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <TouchableOpacity
                  onPress={() => setShowPreviewModal(false)}
                  style={styles.previewCloseBtn}
                >
                  <Text style={styles.previewCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>
              {previewImage && (
                <Image
                  source={{ uri: previewImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>

        {/* ===== VIEW ONCE PREVIEW MODAL ===== */}
        <Modal
          visible={showViewOncePreview}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseViewOnce}
        >
          <View style={styles.previewBackdrop}>
            <SafeAreaView style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <View style={styles.viewOnceHeaderInfo}>
                  <Text style={styles.viewOnceIndicator}>👁️ VIEW ONCE</Text>
                  <Text style={styles.viewOnceWarning}>Content will be deleted after closing</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseViewOnce}
                  style={styles.previewCloseBtn}
                >
                  <Text style={styles.previewCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.viewOnceContent}>
                {viewOncePreviewMsg?.is_e2ee && !viewOncePreviewMsg?.decryptedUri && !(viewOncePreviewMsg?.image?.startsWith('file://') || viewOncePreviewMsg?.videoUri?.startsWith('file://')) ? (
                  <View style={styles.viewOnceLoading}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.viewOnceLoadingText}>Decrypting secure media...</Text>
                  </View>
                ) : (
                  <>
                    {(viewOncePreviewMsg?.originalType === 'image' || viewOncePreviewMsg?.originalType === 'photo' || viewOncePreviewMsg?.image) && (
                      <Image
                        source={{ uri: viewOncePreviewMsg.image }}
                        style={styles.fullImage}
                        resizeMode="contain"
                        onLoad={() => console.log('[ViewOnce] Image loaded successfully')}
                        onError={(e) => console.error('[ViewOnce] Image load error:', e.nativeEvent.error)}
                      />
                    )}
                    {viewOncePreviewMsg?.originalType === 'video' && (
                      <Video
                        source={{ uri: viewOncePreviewMsg.videoUri }}
                        style={styles.fullVideo}
                        useNativeControls
                        resizeMode="contain"
                        shouldPlay
                        onError={(e) => console.error('[ViewOnce] Video playback error:', e)}
                        onLoad={() => console.log('[ViewOnce] Video loaded successfully')}
                      />
                    )}
                    {viewOncePreviewMsg?.originalType === 'file' && (
                      <View style={styles.viewOnceFilePreview}>
                        <Text style={{ fontSize: 64 }}>📄</Text>
                        <Text style={styles.viewOnceFileName}>{viewOncePreviewMsg.fileName}</Text>
                        <TouchableOpacity
                          style={styles.viewOnceFileBtn}
                          onPress={() => handleOpenFile(viewOncePreviewMsg)}
                        >
                          <Text style={styles.viewOnceFileBtnText}>Open Document</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {viewOncePreviewMsg?.originalType === 'text' && (
                      <View style={[styles.viewOnceTextContainer, { maxHeight: screenHeight * 0.7 }]}>
                        <Text style={[styles.viewOnceTextContent, { fontSize: responsiveFontSize(18, screenWidth) }]}>
                          {viewOncePreviewMsg.text}
                        </Text>
                      </View>
                    )}
                    {viewOncePreviewMsg?.originalType === 'voice' && (
                      <View style={styles.viewOnceVoiceContainer}>
                        <VoiceMessagePlayer
                          uri={viewOncePreviewMsg.voiceUri}
                          durationText={viewOncePreviewMsg.duration}
                          isSent={false}
                          screenWidth={screenWidth}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* ===== CHAT LOCK MODAL ===== */}
        <ChatLockModal
          visible={showLockModal}
          onClose={() => setShowLockModal(false)}
          contactName={contactName}
          contactCid={contactCID}
          currentPassword={currentLockPassword}
          onSave={async (newPassword) => {
            if (newPassword) {
              await setChatLock(contactCID, newPassword);
              setCurrentLockPassword(newPassword);
            } else {
              await clearChatLock(contactCID);
              setCurrentLockPassword(null);
            }
            setShowLockModal(false);
          }}
          screenDimensions={screenDimensions}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  multiSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  multiSelectTitle: {
    flex: 1,
    fontWeight: '700',
    color: COLORS.primary,
  },
  multiSelectActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  multiSelectActionBtn: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    minWidth: 44,
  },
  deleteActionBtn: {
    backgroundColor: COLORS.errorLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  backArrow: {
    color: COLORS.primary,
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  contactAvatar: {
    backgroundColor: COLORS.avatar.blue,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontWeight: '600',
    color: COLORS.dark,
  },
  contactStatus: {
    color: COLORS.slate400,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerIconBtn: {
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
  },
  encryptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  encryptionText: {
    flex: 1,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  verifyBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    minHeight: 32,
    justifyContent: 'center',
  },
  verifyText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  messagesList: {
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sentRow: {
    justifyContent: 'flex-end',
  },
  imageContainer: {
    marginTop: 4,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  bubbleImage: {
    backgroundColor: COLORS.gray100,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewOnceHeaderInfo: {
    flex: 1,
  },
  viewOnceIndicator: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  viewOnceWarning: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  viewOnceContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewOnceFilePreview: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  viewOnceFileName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  viewOnceFileBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  viewOnceFileBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  previewCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCloseIcon: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  smallAvatar: {
    borderRadius: 16,
    backgroundColor: COLORS.avatar.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderNickname: {
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 2,
    marginLeft: 4,
  },
  selectCheckbox: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkmark: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    position: 'relative',
  },
  sentBubble: {
    backgroundColor: COLORS.primary,
  },
  imageBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  receivedBubble: {
    backgroundColor: COLORS.slate100,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: RADIUS.md,
    minWidth: 180,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontWeight: '700',
  },
  fileSize: {
    fontWeight: '500',
  },
  bubbleSelected: {
    opacity: 0.7,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  forwardedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs - 2,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
    alignSelf: 'flex-start',
  },
  forwardedText: {
    fontWeight: '600',
    color: COLORS.dark,
  },
  bubbleText: {
    lineHeight: 20,
    fontWeight: '400',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  voicePlayBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  voiceWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    marginHorizontal: SPACING.sm,
  },
  waveLine: {
    width: 3,
    height: 6,
    borderRadius: 2,
    opacity: 0.6,
  },
  voiceDurationText: {
    fontWeight: '500',
  },
  viewOnceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
  },
  reactionPill: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: SPACING.sm - 2,
    paddingVertical: SPACING.xs - 2,
    borderRadius: RADIUS.sm,
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: COLORS.timerBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs - 2,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  },
  timerText: {
    color: COLORS.timerText,
    fontWeight: '600',
  },
  encryptionIndicator: {
    marginTop: SPACING.xs,
  },
  sentMeta: {
    alignItems: 'flex-end',
    gap: 1,
  },
  timeText: {
    color: COLORS.slate400,
    marginTop: SPACING.xs,
  },
  readStatus: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  notificationContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  missedCallNotif: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontWeight: '700',
    color: COLORS.error,
  },
  notifSubtitle: {
    color: COLORS.slate500,
    marginTop: SPACING.xs,
  },
  callBackBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.md,
    minHeight: 32,
    justifyContent: 'center',
  },
  callBackText: {
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  systemInfoContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  systemInfoBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.encryptionBorder,
  },
  systemInfoText: {
    color: COLORS.encryptionText,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    color: COLORS.slate400,
    fontWeight: '500',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  attachBtn: {
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.slate100,
    color: COLORS.dark,
    fontWeight: '400',
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 44,
    minWidth: 44,
  },
  micBtn: {
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInterface: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate100,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    gap: SPACING.md,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  recordingTimerText: {
    flex: 1,
    fontWeight: '600',
    color: COLORS.dark,
  },
  cancelRecBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  cancelRecText: {
    color: COLORS.error,
    fontWeight: '500',
  },
  sendRecBtn: {
    backgroundColor: COLORS.primaryLight,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ===== ACTION SHEET STYLES =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  actionSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: SPACING.lg,
  },
  reactionsSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  reactionsTitle: {
    fontWeight: '700',
    color: COLORS.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: SPACING.md,
  },
  reactionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  reactionBtnActive: {
    backgroundColor: COLORS.primary,
  },
  actionDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    minHeight: 48,
  },
  actionText: {
    flex: 1,
    fontWeight: '500',
    color: COLORS.dark,
  },
  actionArrow: {
    color: COLORS.slate400,
  },
  deleteAction: {
    backgroundColor: COLORS.errorAccent,
  },
  deleteText: {
    flex: 1,
    fontWeight: '600',
    color: COLORS.error,
  },
  actionSheetSpacer: {
    height: SPACING.md,
  },
  // ===== DELETE DIALOG STYLES =====
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  dialogContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dialogTitle: {
    fontWeight: '700',
    color: COLORS.dark,
  },
  dialogSubtitle: {
    color: COLORS.slate500,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
    minHeight: 48,
  },
  deleteOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F7FF',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioFilled: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  optionRadioEmpty: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
  },
  optionContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  optionTitle: {
    fontWeight: '600',
    color: COLORS.dark,
  },
  optionSubtitle: {
    color: COLORS.slate400,
    lineHeight: 16,
  },
  dialogInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    marginVertical: SPACING.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    color: COLORS.dark,
    lineHeight: 16,
    fontWeight: '500',
  },
  dialogButtonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontWeight: '700',
    color: COLORS.white,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: COLORS.dark,
  },
  viewOnceBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.slate100,
  },
  viewOnceBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  viewOnceTextContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    width: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  viewOnceTextContent: {
    color: COLORS.dark,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '500',
  },
  viewOnceVoiceContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  // Premium Modal Styles
  premiumBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  premiumModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  premiumModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  premiumModalSubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 2,
    fontWeight: '500',
  },
  premiumCloseBtn: {
    padding: 8,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
  },
  premiumModalContent: {
    width: '100%',
  },
  premiumManageBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  securityBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 16,
  },
  securityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 1,
  },
  premiumDesc: {
    fontSize: 15,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  premiumActions: {
    width: '100%',
    gap: 12,
  },
  premiumActionBtn: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  dangerActionBtn: {
    backgroundColor: '#FFF1F2',
  },
  dangerText: {
    color: COLORS.error,
  },
  premiumPinEntry: {
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  pinPromt: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 24,
  },
  premiumPinRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  premiumPinBox: {
    width: 44,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.gray50,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumPinBoxFilled: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  premiumPinText: {
    fontSize: 20,
    color: COLORS.gray300,
  },
  premiumPinTextFilled: {
    color: COLORS.primary,
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCheck: {
    fontSize: 40,
    color: COLORS.success,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  uploadProgressContainer: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  uploadProgressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  uploadProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  // View Once Styles
  viewOnceContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000', // Solid black background for media
  },
  fullImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  viewOnceLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  viewOnceLoadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewOnceFilePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    width: '80%',
    gap: 20,
  },
  viewOnceFileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  viewOnceFileBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewOnceFileBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
