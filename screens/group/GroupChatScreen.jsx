import React, { useState, useRef, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';

// Initial system/sample messages for demonstration
const INITIAL_MESSAGES = [
  { id: 'sys1', type: 'system', text: 'Group created · E2EE enabled' },
  {
    id: '1',
    type: 'received',
    sender: 'Ghost_Fox',
    senderNickname: 'Ghost_Fox',
    text: 'Sector clear. Phase 2.',
    time: '08:10',
    verified: true,
  },
  { id: '2', type: 'received', sender: 'Shadow_Wolf', senderNickname: 'Shadow_Wolf', text: 'Copy. En route.', time: '08:11' },
  {
    id: '3',
    type: 'sent',
    text: 'Stand by. 🔒',
    time: '08:12',
  },
  { id: '4', type: 'voice', sender: 'Iron_Mask', senderNickname: 'Iron_Mask', duration: '0:15', time: '08:14' },
];

const SystemMessage = ({ text }) => (
  <View style={styles.sysMsgWrapper}>
    <Text style={styles.sysMsgText}>{text}</Text>
  </View>
);

const ChatBubble = ({ item, onLongPress }) => {
  const isSent = item.type === 'sent';
  if (item.type === 'voice') {
    return (
      <TouchableOpacity 
        style={styles.receivedRow}
        onLongPress={() => onLongPress?.(item)}
        delayLongPress={300}
      >
        <View style={styles.senderAvatar}>
          <MaterialCommunityIcons name="account" size={14} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.senderName}>{item.senderNickname}</Text>
          <View style={styles.voiceBubble}>
            <Ionicons name="mic" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.voiceText}>Voice · {item.duration}</Text>
          </View>
          <Text style={styles.msgTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  }
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
            <Text style={styles.receivedText}>{item.text}</Text>
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
        <Text style={styles.sentText}>{item.text}</Text>
      </View>
      <Text style={[styles.msgTime, { textAlign: 'right', marginRight: 4 }]}>{item.time}</Text>
    </TouchableOpacity>
  );
};

export default function GroupChatScreen({ navigation, route }) {
  const { getGroup } = useGroups();
  const groupId = route?.params?.groupId || route?.params?.group?.id;
  const passedGroup = route?.params?.group;
  
  const group = useMemo(() => {
    return groupId ? getGroup(groupId) : passedGroup || { name: 'OP-SECTOR-7', members: 5, memberList: [] };
  }, [groupId, getGroup, passedGroup]);

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatRef = useRef(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: String(Date.now()),
      type: 'sent',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      verified: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Auto-scroll to bottom
    setTimeout(() => {
      flatRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleMessageLongPress = (message) => {
    if (message.type === 'sent') {
      Alert.alert(
        'Message Options',
        'Select an action',
        [
          {
            text: 'React to Message',
            onPress: () => Alert.alert('Reactions', '👍 ❤️ 😂 😮 😢'),
          },
          {
            text: 'Delete Message',
            onPress: () => {
              setMessages((prev) => prev.filter((m) => m.id !== message.id));
            },
            style: 'destructive',
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        'Message Options',
        'Select an action',
        [
          {
            text: 'React to Message',
            onPress: () => Alert.alert('Reactions', '👍 ❤️ 😂 😮 😢'),
          },
          {
            text: 'Reply',
            onPress: () => {
              setInputText(`@${message.senderNickname} replying to: ${message.text.substring(0, 30)}... `);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
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
          <Text style={styles.headerSub}>{group?.members || 0} members · E2EE</Text>
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
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="attach" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message group..."
            placeholderTextColor={COLORS.placeholder}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            editable={true}
            selectTextOnFocus={true}
          />
          <TouchableOpacity
            style={[styles.sendBtn, inputText.trim() && styles.sendBtnActive]}
            activeOpacity={0.85}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? COLORS.white : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  voiceBubble: {
    backgroundColor: COLORS.bubbleReceived,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceText: {
    fontSize: 13,
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
});