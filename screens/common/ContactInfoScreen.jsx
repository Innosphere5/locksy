import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';
import { Alert } from 'react-native';
import messageStorage from '../../utils/messageStorage';
import socketService from '../../utils/socketService';
import signalingService from '../../src/services/signalingService';
import { useCIDContext } from '../../context/CIDContext';
import { AUTO_DESTRUCT_OPTIONS } from '../../utils/chatRoom';

export default function ContactInfoScreen({ navigation, route }) {
  const contactParam = route?.params?.contact || {};
  const { contacts, userCID, userNickname, userAvatar } = useCIDContext();
  const contact = contacts.find(c => c.cid === contactParam.cid) || contactParam;
  
  // Real check: if no CID, we have no real contact data
  if (!contact.cid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }} 
          style={styles.backBtn}
        >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Info</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.textMuted }}>Contact details not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fingerprints = contact.fingerprints || ['----', '----', '----', '----'];

  const [timer, setTimer] = useState(0);
  const [isCallInitiating, setIsCallInitiating] = useState(false);
  const userAvatarSafe = userAvatar || '👤';

  const handleVoiceCall = async () => {
    try {
      setIsCallInitiating(true);
      const callId = await signalingService.startCall(
        { id: contact.cid, name: contact.name, avatar: contact.avatar },
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

  const handleVideoCall = async () => {
    try {
      setIsCallInitiating(true);
      const callId = await signalingService.startCall(
        { id: contact.cid, name: contact.name, avatar: contact.avatar },
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

  React.useEffect(() => {
    if (contact.roomId) {
      messageStorage.getChatTimer(contact.roomId).then(setTimer);
    }
  }, [contact.roomId]);

  const formatTimer = (ms) => {
    if (!ms || ms === 0) return 'OFF';
    const option = AUTO_DESTRUCT_OPTIONS.find(o => o.ms === ms);
    if (option) return option.label;
    
    // Fallback formatting
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  const handleTimerPress = () => {
    Alert.alert(
      "Temporary Messages",
      "Messages in this chat will disappear after the selected duration. Setting a timer will also apply to existing messages in this chat.",
      [
        ...AUTO_DESTRUCT_OPTIONS.map(opt => ({
          text: opt.label,
          onPress: () => updateTimer(opt.ms)
        })),
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const updateTimer = async (ms) => {
    if (!contact.roomId) return;
    const pruned = await messageStorage.saveChatTimer(contact.roomId, ms);
    setTimer(ms);

    // Sync timer update to the server/other participant
    socketService.updateChatTimer(contact.roomId, ms);

    // Sync prunes to server
    if (pruned && pruned.length > 0) {
      console.log(`[ContactInfo] Syncing ${pruned.length} retroactive prunes to server...`);
      const rooms = [...new Set(pruned.map(p => p.roomId))];
      for (const rid of rooms) {
        const ids = pruned.filter(p => p.roomId === rid).map(p => p.id);
        socketService.deleteMessagesBulk(rid, ids);
      }
    }
  };

  const handleBlockContact = () => {
    Alert.alert(
      "Block Contact",
      `Are you sure you want to block ${contact.name}? They will no longer be able to message or call you.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => {
          // Block logic
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Info</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <View style={{ width: '100%', height: '100%', borderRadius: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              {contact.avatar && typeof contact.avatar === 'string' && (contact.avatar.startsWith('http') || contact.avatar.startsWith('file') || contact.avatar.startsWith('data:') || contact.avatar.startsWith('content')) ? (
                <Image source={{ uri: contact.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={styles.avatarText}>{contact.avatar || '👤'}</Text>
              )}
            </View>
            {contact.onlineStatus && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          <Text style={styles.profileName}>{contact.nickname || contact.name || 'User'}</Text>
          <Text style={styles.profileStatus}>
            {contact.onlineStatus || contact.status === 'online' ? '● Online now' : '● Offline'}
          </Text>
        </View>

        {/* Contact Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="message" size={24} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, isCallInitiating && { opacity: 0.5 }]} 
            onPress={handleVoiceCall}
            disabled={isCallInitiating}
          >
            <MaterialCommunityIcons name="phone" size={24} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, isCallInitiating && { opacity: 0.5 }]} 
            onPress={handleVideoCall}
            disabled={isCallInitiating}
          >
            <MaterialCommunityIcons name="video" size={24} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Video</Text>
          </TouchableOpacity>
        </View>

        {/* CID Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT ID</Text>
          <View style={styles.cidCard}>
            <Text style={styles.cidLabel}>{contact.cid}</Text>
            <TouchableOpacity style={styles.cidCopyBtn}>
              <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
              <Text style={styles.cidCopyText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Encryption & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
          
          <TouchableOpacity style={styles.settingRow} onPress={handleTimerPress}>
            <View style={styles.settingRowLeft}>
              <MaterialCommunityIcons name="timer-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingRowLabel}>Message Timer</Text>
            </View>
            <View style={styles.settingRowRight}>
              <Text style={styles.settingRowValue}>{formatTimer(timer)}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>

        {/* Encryption row removed as requested */}
        </View>

        {/* Fingerprints sections removed as requested */}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionRow} onPress={handleBlockContact}>
            <View style={[styles.actionRowIcon, { backgroundColor: COLORS.error + '15' }]}>
              <MaterialCommunityIcons name="block-helper" size={20} color={COLORS.error} />
            </View>
            <Text style={styles.actionRowLabel}>Block Contact</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
  },
  moreBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  avatarText: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.online,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  profileStatus: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionLabel: {
    ...TYPOGRAPHY.body3,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  cidCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  cidLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 2,
  },
  cidCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
  },
  cidCopyText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  verifyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  verifyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verifyStatus: {
    ...TYPOGRAPHY.body1,
    color: COLORS.success,
    fontWeight: '600',
  },
  verifyDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  fingerprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fingerprintGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fingerprintItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  fingerprintValue: {
    ...TYPOGRAPHY.body3,
    color: COLORS.text,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  actionRowIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionRowLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingRowLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '500',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingRowValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
