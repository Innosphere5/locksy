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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme/colors';
import AttachMediaModal from '../modals/AttachMediaModal';
import AutoCloseModal from '../modals/AutoCloseModal';
import socketService from '../../utils/socketService';
import messageStorage from '../../utils/messageStorage';
import { useCIDContext } from '../../context/CIDContext';

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
// MESSAGE BUBBLE COMPONENT (RESPONSIVE)
// ============================================================================

function MessageBubble({ msg, onLongPress, onReplyPress, isSelected, onSelect, screenDimensions }) {
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
            <View style={styles.voiceContainer}>
              <Text style={{ fontSize: responsiveFontSize(16, screenWidth) }}>🎤</Text>
              <Text
                style={[
                  styles.bubbleText,
                  { 
                    color: isSent ? COLORS.sentText : COLORS.receivedText,
                    fontSize: fontSize
                  },
                ]}
              >
                Voice · {msg.duration}
              </Text>
            </View>
          ) : msg.type === 'view-once' ? (
            <View style={styles.viewOnceContainer}>
              <Text style={{ fontSize: responsiveFontSize(16, screenWidth) }}>👁️</Text>
              <Text
                style={[
                  styles.bubbleText,
                  { 
                    color: isSent ? COLORS.sentText : COLORS.receivedText,
                    fontSize: fontSize
                  },
                ]}
              >
                View Once · Photo
              </Text>
            </View>
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

          {/* Timer badge */}
          {msg.timerMinutes !== undefined && msg.timerMinutes !== null && (
            <View style={styles.timerBadge}>
              <Text style={[styles.timerText, { fontSize: smallFontSize }]}>
                ⏱️ {msg.timerMinutes}m
              </Text>
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

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onAction('timer');
                onClose();
              }}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: responsiveFontSize(18, screenWidth) }}>⏱️</Text>
              <Text style={[styles.actionText, { fontSize: responsiveFontSize(15, screenWidth) }]}>
                Auto-Delete Timer
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
// MAIN CHAT MESSAGE SCREEN COMPONENT (RESPONSIVE)
// ============================================================================

export default function ChatMessageScreen({ navigation, route }) {
  // Get screen dimensions for responsive calculations
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { userCID, userNickname, userAvatar } = useCIDContext();
  
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
  const [showAutoCloseModal, setShowAutoCloseModal] = useState(false);
  const [autocloseTimer, setAutoCloseTimer] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);
  const messagesRef = useRef([]);
  const messageListenerRef = useRef(null);

  // Initialize room and load history
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;

    const initialize = async () => {
      // 1. Load from local storage immediately for fast UI
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

    // 4. Subscribe to new messages using multiplexed listener
    const unsubscribe = socketService.on("message:received", (message) => {
      if (isMounted && message.roomId === roomId) {
        const newMsg = formatSocketMsg(message);
        setMessages(prev => {
          // Deduplicate: If this is a message we sent, it might match a 'temp-' message
          if (newMsg.sender === 'sent') {
             const tempIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.text === newMsg.text);
             if (tempIndex !== -1) {
                // Replace temp message with the official server one (has correct ID and timestamp)
                const next = [...prev];
                next[tempIndex] = newMsg;
                return next;
             }
          }

          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    initialize();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [roomId]);

  // Helper to format socket message to UI message
  const formatSocketMsg = (message) => ({
    id: message.id,
    sender: userCID === message.senderCid ? 'sent' : 'received',
    text: message.message,
    time: new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    type: 'text',
    reactions: [],
    readStatus: userCID === message.senderCid ? 'delivered' : undefined,
    isForwarded: false,
    senderCid: message.senderCid,
    senderNickname: message.senderNickname,
    avatar: message.senderCid !== userCID ? contactAvatar : userAvatarSafe,
  });


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
        // Add reaction to message
        if (selectedMsg) {
          setMessages((prevMsgs) =>
            prevMsgs.map((msg) =>
              msg.id === selectedMsg.id
                ? {
                    ...msg,
                    reactions: msg.reactions.includes(value)
                      ? msg.reactions.filter((r) => r !== value)
                      : [...(msg.reactions || []), value],
                  }
                : msg
            )
          );
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

      case 'timer':
        setShowAutoCloseModal(true);
        break;

      case 'autoclose':
        setAutoCloseTimer(value);
        console.log('Auto-close timer set:', value);
        alert(`✓ Chat will auto-close ${value.label}`);
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
    setInputText('');
    
    // Add to UI immediately
    const tempMsg = {
      id: "temp-" + Date.now(),
      sender: 'sent',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      readStatus: 'sending',
      avatar: userAvatarSafe,
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      socketService.sendMessage(roomId, messageText, userNickname);
    } catch (error) {
      console.error("[ChatMessage] Error sending message:", error);
    }
  };

  // Delete message handler
  const handleDeleteMessage = (type) => {
    if (selectedMsg) {
      setMessages((prevMsgs) =>
        prevMsgs.filter((msg) => msg.id !== selectedMsg.id)
      );
      setSelectedMsg(null);
      setShowDeleteDialog(false);
      alert(`Message deleted ${type === 'everyone' ? 'for everyone' : 'for you'}`);
    }
  };

  // Delete multiple selected messages
  const handleDeleteMultiple = () => {
    setMessages((prevMsgs) =>
      prevMsgs.filter((msg) => !selectedMessages.includes(msg.id))
    );
    exitMultiSelectMode();
    alert('Messages deleted');
  };

  // Handle media attachment selection
  const handleMediaAttach = (mediaInfo) => {
    console.log('Media selected:', mediaInfo);
    const mediaTypeEmojis = {
      photo: '📷',
      video: '🎥',
      voice: '🎤',
      file: '📄',
      once: '👁️',
      timer: '⏱️',
    };

    const emoji = mediaTypeEmojis[mediaInfo.type] || '📎';
    alert(`✓ Ready to send ${mediaInfo.label}\n${emoji}`);
    // Here you can add logic to handle each media type
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
                onPress={() => alert('Voice call initiated')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>☎️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconBtn}
                activeOpacity={0.6}
                onPress={() => setShowAutoCloseModal(true)}
                title="Auto-close chat"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>⏱️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconBtn}
                activeOpacity={0.6}
                onPress={() => alert('Show more options')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: headerIconFontSize }}>⋯</Text>
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
              onReplyPress={() => {}}
              isSelected={multiSelectMode ? selectedMessages.includes(item.id) : undefined}
              onSelect={multiSelectMode ? handleSelectMessage : undefined}
              screenDimensions={screenDimensions}
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

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  width: responsiveSize(36, screenWidth),
                  height: responsiveSize(36, screenWidth),
                  borderRadius: responsiveSize(18, screenWidth),
                },
                !inputText.trim() && styles.sendBtnDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: responsiveFontSize(18, screenWidth), color: COLORS.white }}>
                ➤
              </Text>
            </TouchableOpacity>
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

        {/* ===== AUTO-CLOSE CHAT MODAL ===== */}
        <AutoCloseModal
          visible={showAutoCloseModal}
          onClose={() => setShowAutoCloseModal(false)}
          onConfirm={(option) => handleAction('autoclose', option)}
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
  receivedBubble: {
    backgroundColor: COLORS.slate100,
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
  sendBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
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
});
