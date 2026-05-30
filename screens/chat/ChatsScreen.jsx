import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Switch,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";
import { useCalls } from "../../context/CallsContext";
import { useGroups } from "../../context/GroupsContext";
import { CIDContext } from "../../context/CIDContext";
import useSocketNavigation from "../../hooks/useSocketNavigation";
import messageStorage from "../../utils/messageStorage";
import signalingService from "../../src/services/signalingService";
import socketService from "../../utils/socketService";

function Avatar({ item }) {
  if (item.locked) {
    return (
      <View style={[styles.avatar, { backgroundColor: "#F3F4F6" }]}>
        <Text style={styles.avatarEmoji}>🔒</Text>
      </View>
    );
  }
  return (
    <View style={[styles.avatar, { backgroundColor: item.avatarBg, overflow: 'hidden' }]}>
      {item.avatar && typeof item.avatar === 'string' && (item.avatar.startsWith('http') || item.avatar.startsWith('file') || item.avatar.startsWith('data:') || item.avatar.startsWith('content')) ? (
        <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
      )}
      {item.online && <View style={styles.onlineDot} />}
    </View>
  );
}

function ChatRow({ item, onPress, onLongPress, navigation, handleVoiceCall, handleVideoCall, isCallInitiating }) {
  const { userCID, userNickname, userAvatar } = React.useContext(CIDContext);

  return (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.7}
    >
      <Avatar item={item} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <View style={styles.nameRow}>
            <Text style={[styles.chatName, item.locked && styles.lockedName]}>
              {item.name || 'User'}
            </Text>
            {item.badge && (
              <View style={[styles.badge, { borderColor: item.badgeColor }]}>
                <Text style={[styles.badgeText, { color: item.badgeColor }]}>
                  {item.badge}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.callButtons}>
            {!item.locked && (
              <>
                <TouchableOpacity
                  style={[styles.callBtn, isCallInitiating && { opacity: 0.5 }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleVoiceCall(item);
                  }}
                  activeOpacity={0.7}
                  disabled={isCallInitiating}
                >
                  <Ionicons name="call" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.callBtn, isCallInitiating && { opacity: 0.5 }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleVideoCall(item);
                  }}
                  activeOpacity={0.7}
                  disabled={isCallInitiating}
                >
                  <Ionicons name="videocam" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
            {item.time && <Text style={styles.timeText}>{item.time}</Text>}
          </View>
        </View>
        <View style={styles.chatSubrow}>
          <Text
            style={[
              styles.lastMessage,
              item.locked && styles.lockedMessage,
              item.expires && styles.expiresMessage,
            ]}
            numberOfLines={1}
          >
            {item.locked ? "🔒 Tap to unlock" : item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
          {item.locked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatsScreen({ navigation }) {
  // Auto-navigate when another user adds you as a contact
  useSocketNavigation();

  // Get saved contacts from context
  const { contacts, pendingRequests, acceptRequest, removeContact } = React.useContext(CIDContext);
  const { groupInvites, acceptGroupInvite, rejectGroupInvite } = useGroups();

  const [stealthMode, setStealthMode] = useState(true);
  const [isCallInitiating, setIsCallInitiating] = useState(false);
  const { userCID, userNickname, userAvatar } = React.useContext(CIDContext);
  const insets = useSafeAreaInsets();

  const [selectedChat, setSelectedChat] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Handle navigation after modal is closed to prevent "stuck" UI
  useEffect(() => {
    if (!menuVisible && pendingNavigation) {
      const { route, params } = pendingNavigation;
      navigation.navigate(route, params);
      setPendingNavigation(null);
      setSelectedChat(null);
    }
  }, [menuVisible, pendingNavigation]);

  const handleLongPress = (item) => {
    setSelectedChat(item);
    setMenuVisible(true);
  };

  const handleDeleteChat = () => {
    if (!selectedChat) return;
    Alert.alert(
      "Clear Chat History",
      `Are you sure you want to clear all message history with ${selectedChat.name}? The contact will remain in your list.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete & Remove", 
          style: "destructive", 
          onPress: async () => {
            // 1. Clear local messages
            await messageStorage.clearRoomMessages(selectedChat.roomId);
            
            // 2. Clear server-side history
            socketService.clearChatHistory(selectedChat.roomId);

            // 3. DO NOT REMOVE CONTACT
            // The contact stays in the contacts list, but since there's no history,
            // it will be hidden from this "Chats" screen main list.

            setMenuVisible(false);
            setSelectedChat(null);
            
            // 4. Force immediate UI refresh
            const summaries = await messageStorage.getChatListSub();
            const msgMap = {};
            summaries.forEach(s => {
              msgMap[s.groupId || s.roomId] = s;
            });
            setLastMessages(msgMap);
          }
        }
      ]
    );
  };

  const handleMuteChat = () => {
    if (!selectedChat) return;
    const fullContact = contacts.find(c => c.cid === selectedChat.cid);
    
    setPendingNavigation({
      route: "MuteContact",
      params: { 
        contact: fullContact || {
          name: selectedChat.name,
          cid: selectedChat.cid,
          avatar: selectedChat.avatar,
          roomId: selectedChat.roomId
        }
      }
    });
    setMenuVisible(false);
  };

  const handleViewProfile = () => {
    if (!selectedChat) return;
    const fullContact = contacts.find(c => c.cid === selectedChat.cid);
    
    setPendingNavigation({
      route: "ContactInfo",
      params: { 
        contact: fullContact || {
          name: selectedChat.name,
          cid: selectedChat.cid,
          avatar: selectedChat.avatar,
          roomId: selectedChat.roomId
        }
      }
    });
    setMenuVisible(false);
  };

  const [search, setSearch] = useState("");
  const [lastMessages, setLastMessages] = useState({});

  // Load last messages from local storage
  useEffect(() => {
    const loadLastMsgs = async () => {
      const summaries = await messageStorage.getChatListSub();
      const msgMap = {};
      summaries.forEach(s => {
        msgMap[s.groupId || s.roomId] = s;
      });
      setLastMessages(msgMap);
    };

    loadLastMsgs();

    // Subscribe to socket events for real-time updates (instead of just 3s poll)
    const unsubscribe = socketService.onMessageReceived(loadLastMsgs);
    
    const interval = setInterval(loadLastMsgs, 5000); // Keep as fallback but slower
    return () => {
      clearInterval(interval);
      if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Transform contacts into display format (Strictly 1-to-1)
  const formattedChats = contacts.map((contact) => {
    const lastMsgData = lastMessages[contact.roomId];
    return {
      id: contact.cid,
      name: contact.nickname || contact.name || 'User',
      badge: "E2EE",
      badgeColor: "#4B7BF5",
      lastMessage: lastMsgData ? lastMsgData.lastMessage : "Start chatting...",
      time: lastMsgData ? new Date(lastMsgData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      unread: lastMsgData ? lastMsgData.unread : 0,
      online: contact.status === "online",
      avatar: contact.avatar || "👤",
      avatarBg: "#EEF2FF",
      locked: false,
      isGroup: false, // Ensure this is false
      cid: contact.cid,
      roomId: contact.roomId,
      timestamp: lastMsgData ? new Date(lastMsgData.timestamp).getTime() : 0,
    };
  });

  const allChats = formattedChats
    .filter(chat => lastMessages[chat.roomId]) // Only show chats that have a history summary
    .sort((a, b) => b.timestamp - a.timestamp);

  const filtered = allChats.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()),
  );

  const handleChatPress = (item) => {
    navigation.navigate("ChatMessage", {
      chatId: item.roomId,
      contactName: item.name,
      contactCID: item.cid,
      contactAvatar: item.avatar || '👤',
    });
  };

  const userAvatarSafe = userAvatar || '👤';

  const handleVoiceCall = async (item) => {
    try {
      setIsCallInitiating(true);
      const callId = await signalingService.startCall(
        { id: item.cid, name: item.name, avatar: item.avatar },
        { id: userCID, name: userNickname, avatar: userAvatarSafe },
        "voice"
      );
      if (callId) {
        navigation.navigate("VoiceCall");
      }
    } catch (err) {
      console.error("Voice call initiation failed:", err);
    } finally {
      setIsCallInitiating(false);
    }
  };

  const handleVideoCall = async (item) => {
    try {
      setIsCallInitiating(true);
      const callId = await signalingService.startCall(
        { id: item.cid, name: item.name, avatar: item.avatar },
        { id: userCID, name: userNickname, avatar: userAvatarSafe },
        "video"
      );
      if (callId) {
        navigation.navigate("VideoCall");
      }
    } catch (err) {
      console.error("Video call initiation failed:", err);
    } finally {
      setIsCallInitiating(false);
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={[styles.header, { marginTop: 0 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.appIcon}>
            <Text style={{ fontSize: 20 }}>🔒</Text>
          </View>
          <Text style={styles.appName}>Locksy</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Settings icon */}
          <TouchableOpacity
            style={[styles.iconBtn, { overflow: 'hidden' }]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Avatar / profile */}
          <TouchableOpacity
            style={[styles.iconBtn, { overflow: 'hidden' }]}
            onPress={() => navigation.navigate('EditNickname')}
            activeOpacity={0.7}
          >
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text style={{ fontSize: 20 }}>👤</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stealth Mode Banner */}
      <View style={styles.stealthBanner}>
        <Text style={styles.stealthEmoji}>🙈</Text>
        <View style={styles.stealthText}>
          <Text style={styles.stealthTitle}>Stealth Mode</Text>
          <Text style={styles.stealthSub}>Peer-to-peer encryption active</Text>
        </View>
        <Switch
          value={stealthMode}
          onValueChange={setStealthMode}
          trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <View style={styles.requestsContainer}>
          <Text style={styles.requestsTitle}>Pending Requests ({pendingRequests.length})</Text>
          {pendingRequests.map((req) => (
            <View key={req.fromCid} style={styles.requestRow}>
              <View style={styles.requestAvatar}>
                <Text style={{ fontSize: 20 }}>{req.fromAvatar || "👤"}</Text>
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{req.fromNickname}</Text>
                <Text style={styles.requestCid}>{req.fromCid}</Text>
              </View>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => acceptRequest(req.fromCid)}
              >
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Group Invitations Section */}
      {groupInvites.length > 0 && (
        <View style={[styles.requestsContainer, { borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '08' }]}>
          <Text style={[styles.requestsTitle, { color: COLORS.primary }]}>Group Invitations ({groupInvites.length})</Text>
          {groupInvites.map((inv) => (
            <View key={inv.groupId} style={styles.requestRow}>
              <View style={[styles.requestAvatar, { backgroundColor: COLORS.primary + '15' }]}>
                <Text style={{ fontSize: 20 }}>👥</Text>
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{inv.groupName}</Text>
                <Text style={styles.requestCid}>From {inv.fromNickname}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.acceptBtn, { backgroundColor: '#F1F5F9' }]}
                  onPress={() => rejectGroupInvite(inv.groupId)}
                >
                  <Text style={[styles.acceptBtnText, { color: '#64748B' }]}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => acceptGroupInvite(inv)}
                >
                  <Text style={styles.acceptBtnText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts or messages"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addContactBtn}
          onPress={() => navigation.navigate("AddContactByCID")}
          activeOpacity={0.7}
        >
          <Text style={styles.addContactIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ChatRow
            item={item}
            onPress={() => handleChatPress(item)}
            onLongPress={handleLongPress}
            navigation={navigation}
            handleVoiceCall={handleVoiceCall}
            handleVideoCall={handleVideoCall}
            isCallInitiating={isCallInitiating}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconWrap}>
            <Text style={styles.navEmoji}>💬</Text>
            {formattedChats.reduce((acc, c) => acc + c.unread, 0) > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>
                  {formattedChats.reduce((acc, c) => acc + c.unread, 0)}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, styles.navActive]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Groups")}
        >
          <Text style={styles.navEmoji}>👥</Text>
          <Text style={styles.navLabel}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Vault")}
        >
          <Text style={styles.navEmoji}>🔒</Text>
          <Text style={styles.navLabel}>Vault</Text>
        </TouchableOpacity>
      </View>

      {/* Management Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>{selectedChat?.name}</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleViewProfile}>
              <Ionicons name="person-outline" size={20} color="#475569" />
              <Text style={styles.menuText}>View Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleMuteChat}>
              <Ionicons name="notifications-off-outline" size={20} color="#475569" />
              <Text style={styles.menuText}>Mute Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Ionicons name="archive-outline" size={20} color="#475569" />
              <Text style={styles.menuText}>Archive Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.deleteItem]} onPress={handleDeleteChat}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Clear History</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  stealthBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  stealthEmoji: { fontSize: 22 },
  stealthText: { flex: 1 },
  stealthTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  stealthSub: {
    fontSize: 12,
    color: "#3B82F6",
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    padding: 0,
  },
  addContactBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addContactIcon: { fontSize: 20 },
  listContent: { paddingBottom: 12 },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 24 },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  chatInfo: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  lockedName: { color: "#9CA3AF" },
  callButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "600" },
  timeText: { fontSize: 12, color: "#94A3B8" },
  chatSubrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  lockedMessage: { color: "#3B82F6" },
  expiresMessage: { color: "#3B82F6" },
  unreadBadge: {
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  lockIcon: { fontSize: 16 },
  separator: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 78 },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  navIconWrap: { position: "relative" },
  navEmoji: { fontSize: 22 },
  navBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  navBadgeText: { fontSize: 9, fontWeight: "700", color: "#FFF" },
  navLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  navActive: { color: "#3B82F6", fontWeight: "600" },

  // Management Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  deleteItem: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },

  // Requests
  requestsContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  requestsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  requestCid: {
    fontSize: 12,
    color: "#94A3B8",
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
