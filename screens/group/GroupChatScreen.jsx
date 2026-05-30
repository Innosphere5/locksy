import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  Vibration,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';
import { useCIDContext } from '../../context/CIDContext';
import { Audio, Video, ResizeMode } from 'expo-av';
import socketService from '../../utils/socketService';
import messageStorage from '../../utils/messageStorage';
import { encryptAESGCM, toBase64, fromBase64 } from '../../utils/cryptoEngine';
import { uploadE2EEFile, downloadAndDecryptFile } from '../../utils/e2eeFileService';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AttachMediaModal from '../modals/AttachMediaModal';

/**
 * Ensure a URI is properly formatted for React Native components
 * Fixes "black image" and "audio ENOENT" issues by adding file:// prefix to raw paths
 */
const ensureUri = (uri) => {
  if (!uri) return null;
  if (typeof uri !== 'string') return uri;
  if (uri.startsWith('http') || uri.startsWith('data:') || uri.startsWith('file:') || uri.startsWith('content:')) {
    return uri;
  }
  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }
  return uri;
};

const SystemMessage = ({ text }) => (
  <View style={styles.sysMsgWrapper}>
    <Text style={styles.sysMsgText}>{text}</Text>
  </View>
);

const ChatBubble = ({ item, onLongPress, onFilePress }) => {
  const isSent = item.type === 'sent';
  const isMedia = item.media && typeof item.media === 'object';
  const isViewOnce = item.media?.isViewOnce || item.type === 'view-once';

  const renderMediaContent = () => {
    if (isViewOnce) {
      const isOpened = item.media?.isOpened;
      return (
        <TouchableOpacity 
          style={styles.viewOnceContainer}
          onPress={() => isOpened ? null : onFilePress(item)}
          activeOpacity={isOpened ? 1 : 0.7}
        >
          <Ionicons 
            name={isOpened ? "eye-off" : "eye"} 
            size={20} 
            color={isSent ? COLORS.white : (isOpened ? COLORS.textMuted : COLORS.primary)} 
          />
          <Text style={[
            styles.viewOnceText, 
            { color: isSent ? COLORS.white : (isOpened ? COLORS.textMuted : COLORS.text) }
          ]}>
            {isOpened ? 'Opened View Once' : 'View Once Message'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (!isMedia) return <Text style={isSent ? styles.sentText : styles.receivedText}>{item.text}</Text>;
    
    const media = item.media;
    if (media.type === 'image') {
      return (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: ensureUri(media.uri) }} style={styles.msgImage} resizeMode="cover" />
        </View>
      );
    }
    if (media.type === 'video') {
      return (
        <View style={styles.mediaContainer}>
          <Video
            source={{ uri: ensureUri(media.uri) }}
            style={styles.msgVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        </View>
      );
    }
    if (media.type === 'file') {
      return (
        <TouchableOpacity 
          style={styles.fileContainer} 
          onPress={() => onFilePress(item)}
        >
          <Ionicons name="document-text" size={24} color={isSent ? COLORS.white : COLORS.primary} />
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: isSent ? COLORS.white : COLORS.text }]} numberOfLines={1}>
              {media.name || 'Document'}
            </Text>
            <Text style={[styles.fileSize, { color: isSent ? 'rgba(255,255,255,0.7)' : COLORS.textMuted }]}>
              {media.size ? `${(media.size / 1024).toFixed(1)} KB` : 'Media File'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    if (media.type === 'voice') {
      return (
        <VoiceMessagePlayer 
          uri={media.uri} 
          duration={media.duration} 
          isSent={isSent} 
        />
      );
    }
    return <Text style={isSent ? styles.sentText : styles.receivedText}>{item.text || '[Media]'}</Text>;
  };

  if (!isSent) {
    return (
      <TouchableOpacity
        style={styles.receivedRow}
        onLongPress={() => onLongPress?.(item)}
        delayLongPress={300}
        activeOpacity={0.9}
      >
        <View style={styles.senderAvatar}>
          <Text style={styles.avatarText}>{item.senderNickname?.[0] || '?'}</Text>
        </View>
        <View style={{ maxWidth: '72%' }}>
          <View style={styles.senderHeader}>
            <Text style={styles.senderName}>{item.senderNickname}</Text>
          </View>
          <View style={styles.receivedBubble}>
            {renderMediaContent()}
          </View>
          <Text style={styles.msgTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.sentRow}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={300}
      activeOpacity={0.9}
    >
      <View style={styles.sentBubble}>
        {renderMediaContent()}
      </View>
      <View style={styles.sentMeta}>
        <Text style={styles.msgTime}>{item.time}</Text>
        {item.status === 'sending' ? (
          <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
        ) : item.status === 'sent' ? (
          <Ionicons name="checkmark-outline" size={12} color={COLORS.textMuted} />
        ) : item.status === 'delivered' ? (
          <Ionicons name="checkmark-done-outline" size={12} color={COLORS.textMuted} />
        ) : item.status === 'read' ? (
          <Ionicons name="checkmark-done" size={12} color={COLORS.primary} />
        ) : (
          <Ionicons name="checkmark-done" size={12} color={COLORS.primary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

// --- NEW: Voice Player Component ---
const VoiceMessagePlayer = ({ uri, duration, isSent }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
        const soundUri = ensureUri(uri);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: soundUri },
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
    <TouchableOpacity onPress={togglePlayback} style={styles.voicePlayer}>
      <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={isSent ? COLORS.white : COLORS.primary} />
      <View style={styles.waveformContainer}>
        <View style={[styles.waveform, { backgroundColor: isSent ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }]} />
      </View>
      <Text style={[styles.voiceDuration, { color: isSent ? COLORS.white : COLORS.textMuted }]}>{duration}</Text>
    </TouchableOpacity>
  );
};

export default function GroupChatScreen({ navigation, route }) {
  const { groups, getGroup, decryptGroupMessage } = useGroups();
  const { userCID, userNickname, userAvatar } = useCIDContext();
  const routeGroupId = route?.params?.groupId;
  
  const group = useMemo(() => {
    // Try to find by routeGroupId first
    let found = getGroup(routeGroupId);
    // If not found (maybe ID swapped), try to find by name if it's a recent pending group
    if (!found && route?.params?.group?.name) {
       found = groups.find(g => g.name === route?.params?.group?.name);
    }
    return found || route?.params?.group;
  }, [routeGroupId, getGroup, groups, route?.params?.group]);

  const groupId = group?.groupId || routeGroupId;
  const isFocused = useIsFocused();

  // AUTO-EXIT: If we are in the chat but the group is removed from our list (e.g. we were kicked), go back
  useEffect(() => {
    if (groupId && !groups.some(g => g.groupId === groupId)) {
      console.log(`[GroupChat] Group ${groupId} no longer exists in list, exiting...`);
      navigation.navigate('Groups');
    }
  }, [groups, groupId, navigation]);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);
  const flatRef = useRef(null);

  // New states for File Opening, View Once, and Deletion
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewOncePreview, setShowViewOncePreview] = useState(false);
  const [viewOncePreviewMsg, setViewOncePreviewMsg] = useState(null);
  const [isViewOnceSelected, setIsViewOnceSelected] = useState(false);

  // ── Load History & Setup Listeners ───────────────────────────────
  useEffect(() => {
    if (!groupId) return;

    const loadHistory = async () => {
      const stored = await messageStorage.getMessages(groupId);
      const decrypted = await Promise.all(stored.map(async (m) => {
        let content = await decryptGroupMessage(groupId, m.message);
        
        // --- NEW: Download and Decrypt if it's an S3 media object ---
        if (content && typeof content === 'object' && content.mediaId) {
          try {
            const keyBytes = fromBase64(group.groupKey);
            const isSentByMe = m.senderCid === userCID;
            const fileInfo = content.uri ? await FileSystem.getInfoAsync(content.uri).catch(() => ({ exists: false })) : { exists: false };
            
            // If not sent by me, or file doesn't exist locally, download it
            if (!isSentByMe || !fileInfo.exists || (content.uri && typeof content.uri === 'string' && content.uri.startsWith('http'))) {
              const localUri = await downloadAndDecryptFile(keyBytes, { id: content.mediaId });
              content = { ...content, uri: localUri };
            }
          } catch (err) {
            console.error("[GroupChat] Failed to download media for history:", err);
          }
        }

        const isMedia = content && typeof content === 'object';
        return {
          id: m.id,
          type: m.senderCid === userCID ? 'sent' : 'received',
          senderNickname: m.senderNickname,
          text: isMedia ? '' : content,
          media: isMedia ? content : null,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: m.createdAt || new Date(m.timestamp).getTime(),
          verified: true,
          status: 'delivered'
        };
      }));
      setMessages(prev => {
        const combined = [...prev, ...decrypted];
        const seen = new Set();
        return combined.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      });
    };

    const initializeChat = async () => {
      await loadHistory();
      
      try {
        await socketService.waitForConnection();
        await socketService.joinRoom(groupId);
        
        // --- PROACTIVE PRUNING ---
        await messageStorage.pruneExpiredMessages();

        const history = await socketService.getChatHistory(groupId);
        if (history && history.messages) {
          const now = Date.now();
          const timerMs = await messageStorage.getChatTimer(groupId);
          
          const validHistory = history.messages.filter(m => {
            const timestamp = new Date(m.timestamp).getTime();
            if (timerMs > 0 && (now - timestamp > timerMs)) return false;
            return true;
          });

          const decrypted = await Promise.all(validHistory.map(async (m) => {
            let content = await decryptGroupMessage(groupId, m.message);
            
            // --- NEW: Download and Decrypt if it's an S3 media object ---
            if (content && typeof content === 'object' && content.mediaId) {
              try {
                const keyBytes = fromBase64(group.groupKey);
                const isSentByMe = m.senderCid === userCID;
                const fileInfo = content.uri ? await FileSystem.getInfoAsync(content.uri).catch(() => ({ exists: false })) : { exists: false };

                if (!isSentByMe || !fileInfo.exists || (content.uri && typeof content.uri === 'string' && content.uri.startsWith('http'))) {
                  const localUri = await downloadAndDecryptFile(keyBytes, { id: content.mediaId });
                  content = { ...content, uri: localUri };
                }
              } catch (err) {
                console.error("[GroupChat] Failed to download synced media:", err);
              }
            }

            const isMedia = content && typeof content === 'object';
            
            // Save to local storage
            await messageStorage.saveMessage(groupId, m);

            return {
              id: m.id,
              type: m.senderCid === userCID ? 'sent' : 'received',
              senderNickname: m.senderNickname,
              text: isMedia ? '' : content,
              media: isMedia ? content : null,
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: m.createdAt || new Date(m.timestamp).getTime(),
              verified: true,
              status: 'delivered'
            };
          }));
          setMessages(prev => {
            const combined = [...prev, ...decrypted];
            const seen = new Set();
            return combined.filter(m => {
              if (seen.has(m.id)) return false;
              seen.add(m.id);
              return true;
            }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          });
        }
      } catch (err) {
        if (err?.message === 'Room or Group not found') {
          console.log("[GroupChat] Group no longer exists on server, exiting...");
          navigation.navigate('Groups');
        } else {
          console.warn("[GroupChat] Failed to sync group history:", err);
        }
      }
    };

    initializeChat();

    const unsubscribe = socketService.on('message:received', async (msg) => {
      if (msg.groupId === groupId) {
        let content = await decryptGroupMessage(groupId, msg.message);
        
        // --- NEW: Download and Decrypt if it's an S3 media object ---
        if (content && typeof content === 'object' && content.mediaId) {
          try {
            const keyBytes = fromBase64(group.groupKey);
            const isSentByMe = msg.senderCid === userCID;
            const fileInfo = content.uri ? await FileSystem.getInfoAsync(content.uri).catch(() => ({ exists: false })) : { exists: false };

            if (!isSentByMe || !fileInfo.exists || (content.uri && typeof content.uri === 'string' && content.uri.startsWith('http'))) {
              const localUri = await downloadAndDecryptFile(keyBytes, { id: content.mediaId });
              content = { ...content, uri: localUri };
            }
          } catch (err) {
            console.error("[GroupChat] Failed to download incoming media:", err);
          }
        }

        const isMedia = content && typeof content === 'object';
        const newMessage = {
          id: msg.id,
          type: msg.senderCid === userCID ? 'sent' : 'received',
          senderNickname: msg.senderNickname,
          text: isMedia ? '' : content,
          media: isMedia ? content : null,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: msg.createdAt || new Date(msg.timestamp).getTime(),
          verified: true,
          status: msg.status || 'delivered'
        };

        // --- STATUS: Emit DELIVERED ---
        if (newMessage.type === 'received') {
          socketService.emitMessageDelivered(null, groupId, newMessage.id);
        }
        
        setMessages(prev => {
          // If this is our own message coming back, replace the 'sending' version
          const exists = prev.find(m => m.id === msg.id);
          if (exists) {
            return prev.map(m => m.id === msg.id ? newMessage : m);
          }
          const combined = [...prev, newMessage];
          const seen = new Set();
          return combined.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        });
      }
    });

    const unsubDeleted = socketService.on('message:deleted', ({ messageId, groupId: gId }) => {
      if (gId === groupId) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    });

    const unsubOpened = socketService.on('message:opened', ({ messageId, groupId: gId }) => {
      if (gId === groupId) {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, media: { ...m.media, isOpened: true } } : m
        ));
      }
    });

    const unsubBulk = socketService.on('message:deleted_bulk', ({ messageIds, roomId: rid }) => {
      if (rid === groupId) {
        setMessages(prev => prev.filter(m => !messageIds.includes(m.id)));
      }
    });

    const unsubStatus = socketService.on("message:status:update", (data) => {
      if (data.groupId === groupId) {
        setMessages(prev => prev.map(m => {
          if (m.id === data.messageId) {
            return { ...m, status: data.status };
          }
          return m;
        }));
      }
    });

    const unsubSent = socketService.on("message:sent", (data) => {
      if (data.groupId === groupId) {
        setMessages(prev => prev.map(m => {
          if (m.id === data.tempId || m.id === data.id) {
            return { ...m, id: data.id, status: 'sent' };
          }
          return m;
        }));
      }
    });

    // Periodic pruning interval
    const pruneInterval = setInterval(async () => {
      const pruned = await messageStorage.pruneExpiredMessages();
      if (pruned && pruned.length > 0) {
        const ids = pruned.filter(p => p.roomId === groupId).map(p => p.id);
        if (ids.length > 0) {
          socketService.deleteMessagesBulk(groupId, ids);
          setMessages(prev => prev.filter(m => !ids.includes(m.id)));
        }
      }
    }, 30000);

    const unsubscribeUpdate = socketService.on('group:update', (data) => {
      if (data.groupId === groupId) {
        let systemText = '';
        if (data.type === 'member_added') {
          systemText = `${data.member?.nickname || 'New member'} was added to the group`;
        } else if (data.type === 'member_removed') {
          systemText = `${data.memberNickname || 'A member'} was removed from the group`;
        } else if (data.type === 'member_left') {
          systemText = `${data.memberNickname || 'A member'} left the group`;
        } else if (data.type === 'admin_promoted') {
          systemText = `${data.memberNickname || 'A member'} was promoted to Admin`;
        }

        if (systemText) {
          const sysMsg = {
            id: 'sys-' + Date.now(),
            type: 'system',
            text: systemText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, sysMsg]);
        }
      }
    });

    return () => {
      unsubscribe();
      unsubDeleted();
      unsubOpened();
      unsubBulk();
      unsubStatus();
      unsubSent();
      unsubscribeUpdate();
      socketService.leaveRoom(groupId);
      clearInterval(pruneInterval);
    };
  }, [groupId, decryptGroupMessage, userCID, group]);

  // Mark group messages as read when screen is focused
  useEffect(() => {
    if (isFocused && groupId && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.type === 'received' && m.status !== 'read');
      if (unreadMessages.length > 0) {
        console.log(`[GroupChat] Marking ${unreadMessages.length} messages as read`);
        unreadMessages.forEach(m => {
          socketService.emitMessageRead(null, groupId, m.id);
        });

        setMessages(prev => prev.map(m => {
          if (m.type === 'received' && m.status !== 'read') {
            return { ...m, status: 'read' };
          }
          return m;
        }));
      }
    }
  }, [isFocused, groupId, messages.length]);

  // --- HANDLERS ---
  const handleOpenFile = async (item) => {
    try {
      const uri = item.media?.uri;
      if (!uri) {
        if (item.type === 'view-once' || item.media?.isViewOnce) {
          handleOpenViewOnce(item);
        }
        return;
      }
      const cleanUri = ensureUri(uri);
      
      if (Platform.OS === 'android') {
        const cUri = await FileSystem.getContentUriAsync(cleanUri);
        
        // Use provided mimeType or infer from extension
        let mimeType = item.media?.mimeType;
        if (!mimeType) {
          const extension = uri.split('.').pop()?.toLowerCase();
          const mimeMap = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'rtf': 'application/rtf',
            'zip': 'application/zip',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4'
          };
          mimeType = mimeMap[extension] || '*/*';
        }

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: cUri,
          type: mimeType,
          flags: 1,
        });
      } else {
        await Sharing.shareAsync(cleanUri);
      }
    } catch (err) {
      console.error("[GroupChat] Error opening file:", err);
      Alert.alert("Error", "Could not open this file. You might need an app that supports this file type.");
    }
  };

  const handleMessageLongPress = (msg) => {
    Vibration.vibrate(50);
    setSelectedMsg(msg);
    setShowActionSheet(true);
  };

  const handleDeleteMessage = async (type) => {
    if (!selectedMsg) return;
    
    try {
      if (type === 'everyone') {
        socketService.socket.emit('group:delete_message', {
          groupId,
          messageId: selectedMsg.id,
          adminCid: userCID
        });
      }

      // Local deletion
      await messageStorage.deleteMessage(groupId, selectedMsg.id);
      
      // Delete from storage if it's media
      if (selectedMsg.media?.uri) {
        const fileInfo = await FileSystem.getInfoAsync(selectedMsg.media.uri).catch(() => ({ exists: false }));
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(selectedMsg.media.uri).catch(e => console.log("Error deleting file:", e));
        }
      }

      setMessages(prev => prev.filter(m => m.id !== selectedMsg.id));
      setShowDeleteDialog(false);
      setShowActionSheet(false);
      setSelectedMsg(null);
    } catch (err) {
      console.error("[GroupChat] Delete error:", err);
    }
  };

  const handleOpenViewOnce = (msg) => {
    if (msg.media?.isOpened) return;
    setViewOncePreviewMsg(msg);
    setShowViewOncePreview(true);
  };

  const handleCloseViewOnce = async () => {
    if (viewOncePreviewMsg) {
      const msgId = viewOncePreviewMsg.id;
      
      // Mark as opened on server
      socketService.socket.emit('group:open_view_once', {
        groupId,
        messageId: msgId,
        userCid: userCID
      });

      // Local update
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, media: { ...m.media, isOpened: true } } : m
      ));

      // Wipe file from storage
      if (viewOncePreviewMsg.media?.uri) {
        await FileSystem.deleteAsync(viewOncePreviewMsg.media.uri).catch(e => console.log("ViewOnce wipe error:", e));
      }

      setShowViewOncePreview(false);
      setViewOncePreviewMsg(null);
    }
  };

  // Keep view-once preview in sync
  useEffect(() => {
    if (showViewOncePreview && viewOncePreviewMsg) {
      const updated = messages.find(m => m.id === viewOncePreviewMsg.id);
      if (updated && updated.media?.uri && !viewOncePreviewMsg.media?.uri) {
        setViewOncePreviewMsg(updated);
      }
    }
  }, [messages, showViewOncePreview, viewOncePreviewMsg]);

  const handleSendMessage = async (mediaData = null, isViewOnce = false) => {
    if ((!inputText.trim() && !mediaData) || !group?.groupKey) {
      if (!group?.groupKey) console.warn("[GroupChat] Cannot send: groupKey missing");
      return;
    }

    const clientMsgId = uuidv4_local(); // Use a temp ID for optimistic update
    const text = inputText.trim();
    const finalIsViewOnce = isViewOnce || isViewOnceSelected;

    try {
      setIsSending(true);
      const content = mediaData ? { ...mediaData, isViewOnce: finalIsViewOnce } : text;
      
      // Optimistic Update
      const tempMsg = {
        id: clientMsgId,
        type: finalIsViewOnce ? 'view-once' : 'sent',
        senderNickname: userNickname,
        text: mediaData ? '' : text,
        media: mediaData ? { ...mediaData, isViewOnce: finalIsViewOnce } : null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verified: true,
        status: 'sending',
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, tempMsg]);
      if (!mediaData) setInputText('');
      setIsViewOnceSelected(false);

      // Ensure we have the group key as a Uint8Array
      const keyBytes = fromBase64(group.groupKey);

      // Encrypt message for the group
      const payload = typeof content === 'string' ? content : JSON.stringify(content);
      const encrypted = await encryptAESGCM(keyBytes, payload);
      
      const messageData = {
        id: clientMsgId, // Pass the same ID to the server
        groupId,
        senderCid: userCID,
        senderNickname: userNickname,
        senderAvatar: userAvatar,
        message: encrypted,
      };

      // Emit to server
      socketService.socket.emit("message:send", messageData);
      
    } catch (e) {
      console.error("[GroupChat] Send failed:", e);
      Alert.alert("Error", "Failed to send message");
      // Remove the failed message
      setMessages(prev => prev.filter(m => m.id !== clientMsgId));
    } finally {
      setIsSending(false);
    }
  };

  // Simple local UUID helper since we don't have uuid lib here usually
  const uuidv4_local = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleMediaSelect = async (selection) => {
    try {
      if (selection.type === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.6,
          base64: true,
        });
        if (!result.canceled) {
          const asset = result.assets[0];
          
          // Use the group key to encrypt for S3
          const keyBytes = fromBase64(group.groupKey);
          setIsSending(true);

          try {
            const uploadedMedia = await uploadE2EEFile(
              keyBytes,
              userCID,
              groupId,
              groupId,
              asset.uri,
              asset.size
            );

            handleSendMessage({
              type: 'image',
              uri: asset.uri, // Use local URI for optimistic UI
              mediaId: uploadedMedia.id,
              name: asset.fileName || 'photo.jpg',
            }, selection.isViewOnce);
          } catch (err) {
            console.error("Image upload failed", err);
            Alert.alert("Error", "Failed to upload image");
          } finally {
            setIsSending(false);
          }
        }
      } else if (selection.type === 'video') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          quality: 0.5,
        });
        if (!result.canceled) {
          const asset = result.assets[0];
          
          // Use the group key to encrypt for S3
          const keyBytes = fromBase64(group.groupKey);
          setIsSending(true);

          try {
            const uploadedMedia = await uploadE2EEFile(
              keyBytes,
              userCID,
              groupId,
              groupId,
              asset.uri,
              asset.size
            );

            handleSendMessage({
              type: 'video',
              uri: asset.uri, // Local URI for UI
              mediaId: uploadedMedia.id,
              name: 'video.mp4',
            }, selection.isViewOnce);
          } catch (err) {
            console.error("Video upload failed", err);
            Alert.alert("Error", "Failed to upload video");
          } finally {
            setIsSending(false);
          }
        }
      } else if (selection.type === 'file') {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
        if (!result.canceled) {
          const asset = result.assets[0];
          
          // Use the group key to encrypt for S3
          const keyBytes = fromBase64(group.groupKey);
          setIsSending(true);

          try {
            const uploadedMedia = await uploadE2EEFile(
              keyBytes,
              userCID,
              groupId,
              groupId,
              asset.uri,
              asset.size
            );

            handleSendMessage({
              type: 'file',
              uri: asset.uri, // Local URI for UI
              mediaId: uploadedMedia.id,
              name: asset.name,
              size: asset.size,
              mimeType: asset.mimeType,
            }, selection.isViewOnce);
          } catch (err) {
            console.error("File upload failed", err);
            Alert.alert("Error", "Failed to upload file");
          } finally {
            setIsSending(false);
          }
        }
      } else if (selection.type === 'voice') {
        handleStartRecording();
      }
    } catch (err) {
      console.error("[GroupChat] Media selection error:", err);
      Alert.alert("Error", "Failed to pick media");
    }
  };

  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Microphone access is needed for voice messages");
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

  const handleStopAndSendRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const mins = Math.floor(recordingDuration / 60);
      const secs = recordingDuration % 60;
      const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      setRecording(null);
      setRecordingDuration(0);

      if (!uri) return;

      const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      
      // Use the group key to encrypt for S3
      const keyBytes = fromBase64(group.groupKey);
      
      // Show loading/sending state
      const tempId = uuidv4_local();
      const tempMsg = {
        id: tempId,
        type: 'sent',
        senderNickname: userNickname,
        text: '',
        media: { type: 'voice', uri, duration: durationStr },
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sending'
      };
      setMessages(prev => [...prev, tempMsg]);

      try {
        const uploadedMedia = await uploadE2EEFile(
          keyBytes,
          userCID,
          groupId,
          groupId,
          uri,
          null
        );

        handleSendMessage({
          type: 'voice',
          uri, // Use the local URI for optimistic UI
          mediaId: uploadedMedia.id,
          duration: durationStr,
        });
      } catch (err) {
        console.error("Audio upload failed", err);
        Alert.alert("Error", "Failed to upload voice message");
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }

    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'system') return <SystemMessage text={item.text} />;
    return (
      <ChatBubble 
        item={item} 
        onLongPress={handleMessageLongPress} 
        onFilePress={handleOpenFile}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          {group?.groupLogo ? (
            <Image source={{ uri: group.groupLogo }} style={styles.avatarImageSmall} />
          ) : (
            <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{group?.name || 'Group Chat'}</Text>
          <Text style={styles.headerSub}>{group?.members?.length || 0} members · E2EE</Text>
          <Text style={styles.headerNick}>Nicknames only</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupSettings', { groupId })}
          style={styles.settingsBtn}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupInfo', { group, groupId })}
          style={styles.infoBtn}
        >
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* E2EE Banner */}
      <View style={styles.e2eeBanner}>
        <Ionicons name="key" size={12} color={COLORS.primary} style={{ marginRight: 5 }} />
        <Text style={styles.e2eeText}>Group E2EE · CID never shown</Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          {recording ? (
            <View style={styles.recordingContainer}>
              <TouchableOpacity onPress={() => {
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                setRecording(null);
                setRecordingDuration(0);
              }}>
                <Ionicons name="trash-outline" size={24} color={COLORS.error} />
              </TouchableOpacity>
              <Text style={styles.recordingText}>Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</Text>
              <TouchableOpacity style={styles.sendVoiceBtn} onPress={handleStopAndSendRecording}>
                <Ionicons name="send" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.attachBtn} 
                onPress={() => setIsMediaModalVisible(true)}
                disabled={isSending}
              >
                <Ionicons name="attach" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message group..."
                placeholderTextColor={COLORS.placeholder}
                returnKeyType="send"
                onSubmitEditing={() => handleSendMessage()}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (inputText.trim() || recording) && styles.sendBtnActive]}
                activeOpacity={0.85}
                onPress={() => inputText.trim() ? handleSendMessage() : handleStartRecording()}
              >
                <Ionicons
                  name={inputText.trim() ? "send" : "mic"}
                  size={18}
                  color={(inputText.trim() || recording) ? COLORS.white : COLORS.textMuted}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <AttachMediaModal
        visible={isMediaModalVisible}
        onClose={() => setIsMediaModalVisible(false)}
        onSelectMedia={handleMediaSelect}
      />

      {/* Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowActionSheet(false)}
        >
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>Message Options</Text>
            
            {selectedMsg?.text && (
              <TouchableOpacity style={styles.actionItem} onPress={() => {
                // Copy logic
                setShowActionSheet(false);
              }}>
                <Ionicons name="copy-outline" size={20} color={COLORS.text} />
                <Text style={styles.actionText}>Copy Text</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.actionItem, { borderBottomWidth: 0 }]} 
              onPress={() => setShowDeleteDialog(true)}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
              <Text style={[styles.actionText, { color: COLORS.danger }]}>Delete Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelAction} onPress={() => setShowActionSheet(false)}>
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        visible={showDeleteDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Delete Message?</Text>
            <Text style={styles.dialogMsg}>This will remove the message from your device.</Text>
            
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.dialogBtn} onPress={() => setShowDeleteDialog(false)}>
                <Text style={styles.dialogBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dialogBtn, styles.dialogBtnDestructive]} 
                onPress={() => handleDeleteMessage('me')}
              >
                <Text style={styles.dialogBtnTextDestructive}>Delete for Me</Text>
              </TouchableOpacity>

              {selectedMsg?.type === 'sent' && (
                <TouchableOpacity 
                  style={[styles.dialogBtn, styles.dialogBtnDestructive]} 
                  onPress={() => handleDeleteMessage('everyone')}
                >
                  <Text style={styles.dialogBtnTextDestructive}>Delete for Everyone</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* View Once Preview Modal */}
      <Modal
        visible={showViewOncePreview}
        transparent={false}
        animationType="slide"
      >
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={handleCloseViewOnce} style={styles.closePreviewBtn}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>View Once Media</Text>
          </View>

          <View style={styles.previewContent}>
            {viewOncePreviewMsg?.media?.type === 'image' ? (
              <Image 
                source={{ uri: ensureUri(viewOncePreviewMsg.media.uri) }} 
                style={styles.fullImage} 
                resizeMode="contain" 
              />
            ) : viewOncePreviewMsg?.media?.type === 'video' ? (
              <Video
                source={{ uri: ensureUri(viewOncePreviewMsg.media.uri) }}
                style={styles.fullVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            ) : (
              <ActivityIndicator size="large" color={COLORS.primary} />
            )}
          </View>

          <View style={styles.previewFooter}>
            <Text style={styles.previewWarning}>
              This media will disappear after you close it.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImageSmall: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    lineHeight: 18,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  headerNick: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  infoBtn: {
    padding: 4,
  },
  e2eeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 10,
  },
  e2eeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  messagesList: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 12,
    gap: 12,
  },
  sysMsgWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  sysMsgText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    backgroundColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  receivedRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  senderName: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 3,
  },
  receivedBubble: {
    backgroundColor: COLORS.bubbleReceived,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 4,
  },
  verifiedIcon: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  receivedText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  sentRow: {
    alignItems: 'flex-end',
  },
  sentBubble: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '72%',
  },
  sentText: {
    fontSize: 14,
    color: COLORS.white,
    fontFamily: FONTS.regular,
  },
  msgTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 3,
    marginLeft: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
    backgroundColor: COLORS.background,
  },
  attachBtn: {
    padding: 4,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  mediaContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  msgImage: {
    width: '100%',
    height: '100%',
  },
  msgVideo: {
    width: '100%',
    height: '100%',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  fileSize: {
    fontSize: 10,
    fontFamily: FONTS.regular,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  voiceText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordingText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  sendVoiceBtn: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
  voicePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 10,
    minWidth: 150,
  },
  waveformContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  waveform: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  voiceDuration: {
    fontSize: 10,
  },
  sentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
    marginRight: 4,
  },
  viewOnceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    minWidth: 140,
  },
  viewOnceText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  actionSheetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  cancelAction: {
    marginTop: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dialog: {
    width: '85%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogMsg: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  dialogButtons: {
    gap: 12,
  },
  dialogBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  dialogBtnDestructive: {
    backgroundColor: COLORS.danger + '15',
  },
  dialogBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  dialogBtnTextDestructive: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  closePreviewBtn: {
    padding: 8,
  },
  previewTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 40,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  fullVideo: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  previewFooter: {
    padding: 20,
    alignItems: 'center',
  },
  previewWarning: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
  },
});