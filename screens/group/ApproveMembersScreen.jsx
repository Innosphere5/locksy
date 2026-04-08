import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';

const RequestCard = ({ item, onApprove, onReject }) => (
  <View style={styles.requestCard}>
    <View style={styles.requestAvatar}>
      <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
    </View>
    <View style={styles.requestInfo}>
      <Text style={styles.requestName}>{item.name}</Text>
      <Text style={styles.requestTime}>{item.time}</Text>
    </View>
    <View style={styles.actionBtns}>
      <TouchableOpacity
        style={styles.rejectBtn}
        onPress={() => onReject(item.id)}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={14} color={COLORS.danger} style={{ marginRight: 3 }} />
        <Text style={styles.rejectBtnText}>Reject</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.approveBtn}
        onPress={() => onApprove(item.id)}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark" size={14} color={COLORS.white} style={{ marginRight: 3 }} />
        <Text style={styles.approveBtnText}>Approve</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function ApproveMembersScreen({ navigation, route }) {
  const { getGroup, approveMemberRequest, rejectMemberRequest } = useGroups();
  const groupId = route?.params?.groupId;
  const passedGroupName = route?.params?.groupName;

  const group = groupId ? getGroup(groupId) : null;
  const groupName = group?.name || passedGroupName || 'OP-SECTOR-7';

  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (group?.pendingRequests) {
      setRequests(group.pendingRequests);
    }
  }, [group?.pendingRequests]);

  const handleApprove = (requestId) => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    if (groupId && group) {
      approveMemberRequest(groupId, requestId, {
        name: request.name,
        nickname: request.name,
      });
    }

    Alert.alert('Success', `${request.name} approved and added to group!`);
  };

  const handleReject = (requestId) => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    Alert.alert(
      'Reject Member',
      `Remove "${request.name}" from pending requests?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
            if (groupId) {
              rejectMemberRequest(groupId, requestId);
            }
          },
        },
      ]
    );
  };

  const handleApproveAll = () => {
    if (requests.length === 0) return;

    Alert.alert(
      'Approve All',
      `Approve all ${requests.length} pending members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: () => {
            requests.forEach((req) => {
              if (groupId && group) {
                approveMemberRequest(groupId, req.id, {
                  name: req.name,
                  nickname: req.name,
                });
              }
            });
            setRequests([]);
            Alert.alert('Success', 'All members approved!', [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]);
          },
        },
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
        <Text style={styles.headerTitle}>Join Requests</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Group Tag */}
      {requests.length > 0 && (
        <View style={styles.groupTag}>
          <MaterialCommunityIcons
            name="account-group"
            size={14}
            color={COLORS.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.groupTagText}>
            {groupName} · {requests.length} pending
          </Text>
        </View>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-check" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>No pending requests</Text>
          <TouchableOpacity
            style={styles.backToGroupBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backToGroupBtnText}>Back to Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Approve All */}
      {requests.length > 0 && (
        <TouchableOpacity
          style={styles.approveAllBtn}
          onPress={handleApproveAll}
          activeOpacity={0.85}
        >
          <Text style={styles.approveAllText}>Approve All {requests.length}</Text>
        </TouchableOpacity>
      )}
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
  groupTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.padding,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  groupTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  list: {
    padding: SIZES.padding,
    paddingTop: 10,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rejectBtnText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...SHADOWS.sm,
  },
  approveBtnText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  backToGroupBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  backToGroupBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  approveAllBtn: {
    marginHorizontal: SIZES.padding,
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  approveAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
  },
});
