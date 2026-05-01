import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';
import { useCIDContext } from '../../context/CIDContext';

const GroupItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.groupItem} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.groupAvatar}>
      <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
    </View>
    <View style={styles.groupInfo}>
      <View style={styles.groupRow}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupTime}>{item.time || new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <View style={styles.groupRow}>
        <View style={styles.groupMeta}>
          <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
            <Text style={[styles.badgeText, { color: item.badgeText }]}>{item.badge}</Text>
          </View>
          <Text style={styles.memberCount}>{item.members?.length || 0} members · E2EE</Text>
        </View>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

export default function GroupsScreen({ navigation }) {
  const { groups, groupInvites, setSelectedGroupId, acceptGroupInvite, rejectGroupInvite } = useGroups();
  const { userNickname } = useCIDContext();

  const handleGroupPress = (group) => {
    setSelectedGroupId(group.groupId);
    navigation.navigate('GroupChat', { group });
  };

  const handleAcceptInvite = async (invite) => {
    await acceptGroupInvite(invite);
    // After accepting, the group will appear in the list via the socket update
  };

  const renderInviteItem = ({ item }) => (
    <View style={styles.inviteCard}>
      <View style={styles.inviteInfo}>
        <Text style={styles.inviteTitle}>Invite: {item.groupName}</Text>
        <Text style={styles.inviteSub}>From {item.fromNickname}</Text>
      </View>
      <View style={styles.inviteActions}>
        <TouchableOpacity 
          style={styles.declineBtn} 
          onPress={() => rejectGroupInvite(item.groupId)}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.acceptBtn} 
          onPress={() => handleAcceptInvite(item)}
        >
          <Text style={styles.acceptText}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="account-group-outline" size={64} color={COLORS.border} />
      </View>
      <Text style={styles.emptyTitle}>No groups yet</Text>
      <Text style={styles.emptySubtitle}>
        Create encrypted groups.{'\n'}Only nicknames visible.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateGroup')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {groupInvites.length > 0 && (
        <View style={styles.invitesSection}>
          <FlatList
            data={groupInvites}
            keyExtractor={(item) => item.groupId}
            renderItem={renderInviteItem}
            scrollEnabled={false}
          />
        </View>
      )}

      {groups.length === 0 && groupInvites.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.groupId}
            renderItem={({ item }) => (
              <GroupItem
                item={item}
                onPress={() => handleGroupPress(item)}
              />
            )}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateGroup')}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>+ Create New Group</Text>
          </TouchableOpacity>
        </>
      )}

      {groups.length === 0 && (
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateGroup')}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>Create Group</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Chats')}>
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.tabLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
          <MaterialCommunityIcons name="account-group" size={22} color={COLORS.primary} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Vault')}>
          <Ionicons name="lock-closed-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.tabLabel}>Vault</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },
  groupTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: FONTS.bold,
  },
  memberCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SIZES.padding + 60,
  },
  createBtn: {
    marginHorizontal: SIZES.padding,
    marginBottom: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: COLORS.background,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabActive: {},
  tabLabel: {
    fontSize: 11,
    color: COLORS.tabInactive,
    fontFamily: FONTS.regular,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.border + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitesSection: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.padding,
    paddingTop: 16,
    paddingBottom: 8,
  },
  inviteCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginBottom: 10,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  inviteSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  declineBtn: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  declineText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});