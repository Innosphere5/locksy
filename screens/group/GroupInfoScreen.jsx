import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';
import { useCIDContext } from '../../context/CIDContext';
import socketService from '../../utils/socketService';

const AdminAction = ({ icon, label, count, onPress, iconColor }) => (
  <TouchableOpacity style={styles.adminAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.adminActionIcon, { backgroundColor: iconColor + '18' }]}>
      <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={styles.adminActionLabel}>{label}</Text>
    {count > 0 && (
      <View style={styles.actionBadge}>
        <Text style={styles.actionBadgeText}>{count}</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
  </TouchableOpacity>
);

const MemberRow = ({ item, isAdmin, onRemove, onPromote, isMe }) => (
  <View style={styles.memberRow}>
    <View style={styles.memberAvatar}>
      <Text style={styles.avatarText}>{item.nickname?.[0] || '?'}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.memberName}>{item.nickname} {isMe ? '(You)' : ''}</Text>
      <Text style={styles.memberRole}>{item.role}</Text>
    </View>
    
    {isAdmin && !isMe && (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {item.role !== 'ADMIN' && (
          <TouchableOpacity onPress={() => onPromote(item)}>
            <MaterialCommunityIcons name="shield-star" size={20} color={COLORS.warning} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onRemove(item)}>
          <MaterialCommunityIcons name="account-remove" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

export default function GroupInfoScreen({ navigation, route }) {
  const { getGroup } = useGroups();
  const { userCID } = useCIDContext();
  const groupId = route?.params?.groupId;
  
  const group = getGroup(groupId) || route?.params?.group;

  const isAdmin = group?.members?.find(m => m.cid === userCID)?.role === 'ADMIN';

  const handleRemoveMember = (member) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.nickname}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            socketService.socket.emit("group:remove_member", {
              groupId,
              adminCid: userCID,
              memberCid: member.cid
            });
          }
        }
      ]
    );
  };

  const handlePromoteAdmin = (member) => {
    Alert.alert(
      "Promote to Admin",
      `Are you sure you want to promote ${member.nickname} to Admin?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Promote", 
          onPress: () => {
            socketService.socket.emit("group:promote_admin", {
              groupId,
              adminCid: userCID,
              memberCid: member.cid
            });
          }
        }
      ]
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
        <Text style={styles.headerTitle}>Group Info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Group Avatar + Name */}
        <View style={styles.groupHero}>
          <View style={styles.groupHeroAvatar}>
            <MaterialCommunityIcons name="account-group" size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.groupHeroName}>{group?.name}</Text>
          <Text style={styles.groupHeroDesc}>{group?.description || 'Group description'}</Text>
          <View style={styles.groupHeroMeta}>
            <View style={[styles.pillBadge, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={[styles.pillBadgeText, { color: COLORS.primary }]}>E2EE ✓</Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: COLORS.border }]}>
              <Text style={[styles.pillBadgeText, { color: COLORS.textMuted }]}>
                {group?.members?.length || 0} members
              </Text>
            </View>
          </View>
        </View>

        {/* Admin Actions */}
        {isAdmin && (
          <>
            <Text style={styles.sectionLabel}>ADMIN ACTIONS</Text>
            <View style={styles.card}>
              <AdminAction
                icon="account-plus"
                label="Add Members"
                iconColor={COLORS.success}
                onPress={() => navigation.navigate('AddMembers', { groupId })}
              />
            </View>
          </>
        )}

        {/* Members */}
        <Text style={styles.sectionLabel}>MEMBERS ({group?.members?.length || 0})</Text>
        <View style={styles.card}>
          {group?.members?.map((m, i) => (
            <View key={m.cid || `member-${i}`}>
              <MemberRow 
                item={m} 
                isAdmin={isAdmin} 
                isMe={m.cid === userCID}
                onRemove={handleRemoveMember}
                onPromote={handlePromoteAdmin}
              />
              {i < (group.members?.length || 0) - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <TouchableOpacity 
          style={styles.leaveBtn}
          onPress={() => {
            Alert.alert("Leave Group", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              { text: "Leave", style: "destructive", onPress: () => {
                 socketService.socket.emit("group:remove_member", {
                   groupId,
                   adminCid: userCID,
                   memberCid: userCID
                 });
                 navigation.popToTop();
              }}
            ]);
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={styles.leaveBtnText}>Leave Group</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginRight: 24,
  },
  scroll: {
    paddingBottom: 40,
  },
  groupHero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  groupHeroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  groupHeroName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  groupHeroDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 12,
  },
  groupHeroMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pillBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    fontFamily: FONTS.bold,
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: SIZES.padding,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  adminActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminActionLabel: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  actionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 62,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberName: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 12,
  },
  leaveBtnText: {
    fontSize: 15,
    color: COLORS.danger,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});