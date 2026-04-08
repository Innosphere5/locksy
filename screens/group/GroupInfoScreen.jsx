import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';

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

const MemberRow = ({ item }) => (
  <View style={styles.memberRow}>
    <View style={styles.memberAvatar}>
      <MaterialCommunityIcons name="account" size={18} color={COLORS.primary} />
    </View>
    <Text style={styles.memberName}>{item.name}</Text>
    {item.role === 'ADMIN' && (
      <View style={styles.adminBadge}>
        <Text style={styles.adminBadgeText}>ADMIN</Text>
      </View>
    )}
    {item.role === 'MEMBER' && (
      <View style={styles.memberBadge}>
        <Text style={styles.memberBadgeText}>MEMBER</Text>
      </View>
    )}
  </View>
);

export default function GroupInfoScreen({ navigation, route }) {
  const { getGroup } = useGroups();
  const groupId = route?.params?.groupId;
  const passedGroup = route?.params?.group;
  
  const group = groupId ? getGroup(groupId) : passedGroup || { 
    name: 'OP-SECTOR-7', 
    members: 5, 
    memberList: [],
    pendingRequests: [],
    mode: 'closed'
  };

  const members = group?.memberList || [];
  const pendingCount = group?.pendingRequests?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
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
            <View style={[styles.pillBadge, { backgroundColor: group?.badgeColor || COLORS.badgeClosed }]}>
              <Text style={[styles.pillBadgeText, { color: group?.badgeText || COLORS.badgeClosedText }]}>
                {group?.mode === 'closed' ? '🔒 Closed' : '🤝 Approval'}
              </Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={[styles.pillBadgeText, { color: COLORS.primary }]}>E2EE ✓</Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: COLORS.border }]}>
              <Text style={[styles.pillBadgeText, { color: COLORS.textMuted }]}>
                {group?.members || 0} members
              </Text>
            </View>
          </View>
        </View>

        {/* Admin Actions */}
        <Text style={styles.sectionLabel}>ADMIN ACTIONS</Text>
        <View style={styles.card}>
          <AdminAction
            icon="account-check"
            label="Approve Members"
            count={pendingCount}
            iconColor={COLORS.success}
            onPress={() => navigation.navigate('ApproveMembers', { groupId, groupName: group?.name })}
          />
          <View style={styles.divider} />
          <AdminAction
            icon="account-remove"
            label="Remove Member"
            count={0}
            iconColor={COLORS.danger}
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <AdminAction
            icon="shield-star"
            label="Assign Admin"
            count={0}
            iconColor={COLORS.warning}
            onPress={() => {}}
          />
        </View>

        {/* Members */}
        <Text style={styles.sectionLabel}>MEMBERS ({members.length})</Text>
        <View style={styles.card}>
          {members.length === 0 ? (
            <Text style={styles.emptyMembersText}>No members in this group</Text>
          ) : (
            members.map((m, i) => (
              <View key={m.id}>
                <MemberRow item={m} />
                {i < members.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
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
  },
  editBtn: { padding: 4 },
  editBtnText: {
    fontSize: 15,
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
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
  memberName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontWeight: '500',
  },
  adminBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  memberBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  emptyMembersText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingVertical: 20,
  },
});