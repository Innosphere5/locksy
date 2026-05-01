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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';
import { useCIDContext } from '../../context/CIDContext';
import socketService from '../../utils/socketService';
import messageStorage from '../../utils/messageStorage';
import { encryptAESGCM, toBase64, fromBase64 } from '../../utils/cryptoEngine';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AttachMediaModal from '../modals/AttachMediaModal';
import { Audio, Video, ResizeMode } from 'expo-av';

const SystemMessage = ({ text }) => (
  <View style={styles.sysMsgWrapper}>
    <Text style={styles.sysMsgText}>{text}</Text>
  </View>
);

const ChatBubble = ({ item, onLongPress }) => {
  const isSent = item.type === 'sent';
  const isMedia = item.media && typeof item.media === 'object';
  
  const renderMediaContent = () => {
    if (!isMedia) return <Text style={isSent ? styles.sentText : styles.receivedText}>{item.text}</Text>;
    
    const media = item.media;
    if (media.type === 'image') {
      return (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: media.uri }} style={styles.msgImage} resizeMode="cover" />
        </View>
      );
    }
    if (media.type === 'video') {
      return (
        <View style={styles.mediaContainer}>
          <Video
            source={{ uri: media.uri }}
            style={styles.msgVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        </View>
      );
    }
    if (media.type === 'file') {
      return (
        <View style={styles.fileContainer}>
          <Ionicons name="document-text" size={24} color={isSent ? COLORS.white : COLORS.primary} />
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: isSent ? COLORS.white : COLORS.text }]} numberOfLines={1}>
              {media.name || 'Document'}
            </Text>
            <Text style={[styles.fileSize, { color: isSent ? 'rgba(255,255,255,0.7)' : COLORS.textMuted }]}>
              {media.size ? `${(media.size / 1024).toFixed(1)} KB` : 'Media File'}
            </Text>
          </View>
        </View>
      );
    }
    if (media.type === 'voice') {
      return (
        <View style={styles.voiceContainer}>
          <Ionicons name="mic" size={20} color={isSent ? COLORS.white : COLORS.primary} />
          <Text style={[styles.voiceText, { color: isSent ? COLORS.white : COLORS.text }]}>Voice Message ({media.duration || '0:00'})</Text>
        </View>
      );
    }
    return <Text style={isSent ? styles.sentText : styles.receivedText}>{item.text || '[Unsupported Media]'}</Text>;
  };

  if (item.type === 'received') {
    return (
      <TouchableOpacity
        style={styles.receivedRow}
        onLongPress={() => onLongPress?.(item)}
        delayLongPress={300}
      >
        <View style={styles.senderAvatar}>
          <MaterialCommunityIcons name="account" size={14} color={COLORS.primary} />
        </View>
        <View style={{ maxWidth: '72%' }}>
          <View style={styles.senderHeader}>
            <Text style={styles.senderName}>{item.senderNickname}</Text>
            {item.verified && <Text style={styles.verifiedIcon}>✓</Text>}
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
    >
      <View style={styles.sentBubble}>
        {renderMediaContent()}
      </View>
      <Text style={[styles.msgTime, { textAlign: 'right', marginRight: 4 }]}>{item.time}</Text>
    </TouchableOpacity>
  );
};

export default function GroupChatScreen({ navigation, route }) {
  const { getGroup, decryptGroupMessage } = useGroups();
  const { userCID, userNickname, userAvatar } = useCIDContext();
  const groupId = route?.params?.groupId;
  
  const group = useMemo(() => {
    return getGroup(groupId) || route?.params?.group;
  }, [groupId, getGroup, route?.params?.group]);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMediaModalVisible, setIsMediaModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);
  const flatRef = useRef(null);

  // ── Load History & Setup Listeners ───────────────────────────────
  useEffect(() => {
    if (!groupId) return;

    const loadHistory = async () => {
      const stored = await messageStorage.getMessages(groupId);
      const decrypted = await Promise.all(stored.map(async (m) => {
        const content = await decryptGroupMessage(groupId, m.message);
        const isMedia = content && typeof content === 'object';
        return {
          id: m.id,
          type: m.senderCid === userCID ? 'sent' : 'received',
          senderNickname: m.senderNickname,
          text: isMedia ? '' : content,
          media: isMedia ? content : null,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verified: true,
        };
      }));
      setMessages(decrypted);
    };

    const initializeChat = async () => {
      await loadHistory();
      
      try {
        // Ensure socket is ready
        await socketService.waitForConnection();
        // Join the group room for real-time messages
        socketService.joinRoom(groupId);
        console.log(`[GroupChat] Joined room: ${groupId}`);

        // 3. Sync with server for any missed messages
        const history = await socketService.getChatHistory(groupId);
        if (history && history.messages) {
          const decrypted = await Promise.all(history.messages.map(async (m) => {
            const content = await decryptGroupMessage(groupId, m.message);
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
              verified: true,
              status: 'delivered'
            };
          }));
          setMessages(decrypted);
        }
      } catch (err) {
        console.warn("[GroupChat] Failed to sync group history:", err);
      }
    };

    initializeChat();

    const unsubscribe = socketService.on('message:received', async (msg) => {
      if (msg.groupId === groupId) {
        const content = await decryptGroupMessage(groupId, msg.message);
        const isMedia = content && typeof content === 'object';
        const newMessage = {
          id: msg.id,
          type: msg.senderCid === userCID ? 'sent' : 'received',
          senderNickname: msg.senderNickname,
          text: isMedia ? '' : content,
          media: isMedia ? content : null,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verified: true,
          status: 'delivered'
        };
        
        setMessages(prev => {
          // If this is our own message coming back, replace the 'sending' version
          const exists = prev.find(m => m.id === msg.id);
          if (exists) {
            return prev.map(m => m.id === msg.id ? newMessage : m);
          }
          return [...prev, newMessage];
        });
      }
    });

    const unsubscribeUpdate = socketService.on('group:update', (data) => {
      if (data.groupId === groupId) {
        let systemText = '';
        if (data.type === 'member_added') {
          systemText = `${data.member.nickname} was added to the group`;
        } else if (data.type === 'member_removed') {
          // Find nickname from group members if possible
          const member = group?.members?.find(m => m.cid === data.memberCid);
          systemText = `${member?.nickname || 'A member'} left or was removed`;
        } else if (data.type === 'admin_promoted') {
          const member = group?.members?.find(m => m.cid === data.memberCid);
          systemText = `${member?.nickname || 'A member'} was promoted to Admin`;
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
      unsubscribeUpdate();
    };
  }, [groupId, decryptGroupMessage, userCID, group]);

  const handleSendMessage = async (mediaData = null) => {
    if ((!inputText.trim() && !mediaData) || !group?.groupKey) {
      if (!group?.groupKey) console.warn("[GroupChat] Cannot send: groupKey missing");
      return;
    }

    const clientMsgId = uuidv4_local(); // Use a temp ID for optimistic update
    const text = inputText.trim();

    try {
      setIsSending(true);
      const content = mediaData || text;
      
      // Optimistic Update
      const tempMsg = {
        id: clientMsgId,
        type: 'sent',
        senderNickname: userNickname,
        text: mediaData ? '' : text,
        media: mediaData,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verified: true,
        status: 'sending'
      };
      setMessages(prev => [...prev, tempMsg]);
      if (!mediaData) setInputText('');

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
          handleSendMessage({
            type: 'image',
            uri: `data:image/jpeg;base64,${asset.base64}`,
            name: 'photo.jpg',
          });
        }
      } else if (selection.type === 'video') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          quality: 0.5,
        });
        if (!result.canceled) {
          const asset = result.assets[0];
          const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
          handleSendMessage({
            type: 'video',
            uri: `data:video/mp4;base64,${base64}`,
            name: 'video.mp4',
          });
        }
      } else if (selection.type === 'file') {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
        if (!result.canceled) {
          const asset = result.assets[0];
          const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
          handleSendMessage({
            type: 'file',
            uri: `data:${asset.mimeType};base64,${base64}`,
            name: asset.name,
            size: asset.size,
          });
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
      handleSendMessage({
        type: 'voice',
        uri: `data:audio/m4a;base64,${base64Data}`,
        duration: durationStr,
      });

    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleMessageLongPress = (message) => {
    // ... same as before
  };

  const renderItem = ({ item }) => {
    if (item.type === 'system') return <SystemMessage text={item.text} />;
    return <ChatBubble item={item} onLongPress={handleMessageLongPress} />;
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
          <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{group?.name || 'Group Chat'}</Text>
          <Text style={styles.headerSub}>{group?.members?.length || 0} members · E2EE</Text>
          <Text style={styles.headerNick}>Nicknames only</Text>
        </View>
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
                style={[styles.sendBtn, inputText.trim() && styles.sendBtnActive]}
                activeOpacity={0.85}
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim()}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={inputText.trim() ? COLORS.white : COLORS.textMuted}
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
});