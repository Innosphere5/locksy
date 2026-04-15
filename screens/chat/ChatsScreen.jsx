import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";
import { useCalls } from "../../context/CallsContext";

const CHATS = [
  {
    id: "1",
    name: "Ghost_Fox",
    badge: "E2EE",
    badgeColor: "#4B7BF5",
    lastMessage: "Delivery confirmed",
    time: "14:23",
    unread: 3,
    online: true,
    avatar: "🦊",
    avatarBg: "#EEF2FF",
    locked: false,
    expires: null,
  },
  {
    id: "2",
    name: "Shadow_Wolf",
    badge: null,
    lastMessage: "🔒 Expires in 3h",
    time: "11:07",
    unread: 0,
    online: false,
    avatar: "🐺",
    avatarBg: "#EDE9FE",
    locked: false,
    expires: true,
  },
  {
    id: "3",
    name: "Locked Chat",
    badge: null,
    lastMessage: "Password required",
    time: null,
    unread: 0,
    online: false,
    avatar: null,
    avatarBg: "#F3F4F6",
    locked: true,
    expires: null,
  },
  {
    id: "4",
    name: "OP-SECTOR-7",
    badge: "GROUP",
    badgeColor: "#64748B",
    lastMessage: "🔒 Iron_Mask: stand by",
    time: "08:12",
    unread: 1,
    online: false,
    avatar: "👥",
    avatarBg: "#DBEAFE",
    locked: false,
    expires: null,
  },
];

function Avatar({ item }) {
  if (item.locked) {
    return (
      <View style={[styles.avatar, { backgroundColor: "#F3F4F6" }]}>
        <Text style={styles.avatarEmoji}>🔒</Text>
      </View>
    );
  }
  return (
    <View style={[styles.avatar, { backgroundColor: item.avatarBg }]}>
      <Text style={styles.avatarEmoji}>{item.avatar}</Text>
      {item.online && <View style={styles.onlineDot} />}
    </View>
  );
}

function ChatRow({ item, onPress, navigation }) {
  const { initiateCall } = useCalls();

  const handleVoiceCall = (e) => {
    e.stopPropagation();
    initiateCall(item.id, item.name, item.avatar, "voice");
    navigation.navigate("VoiceCall", {
      callInfo: {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        type: "voice",
        encrypted: true,
        direction: "outgoing",
      },
    });
  };

  const handleVideoCall = (e) => {
    e.stopPropagation();
    initiateCall(item.id, item.name, item.avatar, "video");
    navigation.navigate("VideoCall", {
      callInfo: {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        type: "video",
        encrypted: true,
        direction: "outgoing",
      },
    });
  };

  return (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <Avatar item={item} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <View style={styles.nameRow}>
            <Text style={[styles.chatName, item.locked && styles.lockedName]}>
              {item.name}
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
                  style={styles.callBtn}
                  onPress={handleVoiceCall}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={handleVideoCall}
                  activeOpacity={0.7}
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
  const [stealthMode, setStealthMode] = useState(true);
  const [search, setSearch] = useState("");

  const filtered = CHATS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()),
  );

  const handleChatPress = (item) => {
    if (item.locked) {
      navigation.navigate("UnlockChat", { chatName: item.name });
    } else {
      navigation.navigate("ChatMessage", {
        name: item.name,
        avatar: item.avatar,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.appIcon}>
            <Text style={{ fontSize: 20 }}>🔒</Text>
          </View>
          <Text style={styles.appName}>Locksy</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
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
            navigation={navigation}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconWrap}>
            <Text style={styles.navEmoji}>💬</Text>
            {CHATS.reduce((acc, c) => acc + c.unread, 0) > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>
                  {CHATS.reduce((acc, c) => acc + c.unread, 0)}
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
    </SafeAreaView>
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
    marginTop: 25,
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
});
