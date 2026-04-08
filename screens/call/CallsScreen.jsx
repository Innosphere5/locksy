import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SPACING, RADIUS } from '../../theme';
import { useCalls } from '../../context/CallsContext';

export default function CallsScreen({ navigation }) {
  const { callHistory, deleteCallFromHistory, initiateCall } = useCalls();
  const [selectedCallId, setSelectedCallId] = useState(null);

  // Format time (e.g., 14:23)
  const formatCallTime = (timestamp) => {
    const now = new Date();
    const callDate = new Date(timestamp);
    const diffMs = now - callDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins === 0 ? 'Now' : `${diffMins}m ago`;
    } else if (diffDays === 0) {
      return callDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return callDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Format duration (e.g., 4m 32s)
  const formatDuration = (seconds) => {
    if (seconds === 0) return 'Missed';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleCallPress = (call) => {
    setSelectedCallId(call.id);
    // Could navigate to contact or initiate call
    // initiateCall(call.id, call.name, call.avatar, call.type);
    // navigation.navigate('Call', { call });
  };

  const handleDeleteCall = (callId) => {
    deleteCallFromHistory(callId);
    setSelectedCallId(null);
  };

  const renderCallItem = ({ item }) => {
    const isSelected = selectedCallId === item.id;
    const isIncoming = item.direction === 'incoming';
    const isMissed = item.missed;

    return (
      <View style={styles.callItemContainer}>
        <TouchableOpacity
          style={[styles.callItem, isSelected && styles.callItemActive]}
          onPress={() => handleCallPress(item)}
          activeOpacity={0.7}
        >
          {/* Left: Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: COLORS.avatarBg }]}>
              <Text style={styles.avatarEmoji}>{item.avatar}</Text>
            </View>
            {/* Call direction indicator */}
            <View
              style={[
                styles.callDirectionBadge,
                {
                  backgroundColor: isIncoming ? COLORS.primary : COLORS.success,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isIncoming ? 'call-received' : 'call-made'}
                size={12}
                color={COLORS.white}
              />
            </View>
          </View>

          {/* Center: Call info */}
          <View style={styles.callInfoSection}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.callName,
                  isMissed && { color: COLORS.error },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.encrypted && (
                <Ionicons
                  name="lock-closed"
                  size={12}
                  color={COLORS.primary}
                  style={styles.lockIcon}
                />
              )}
            </View>
            <Text style={styles.callType}>
              {item.type === 'voice' ? '📞 Voice' : '📹 Video'} • {formatDuration(item.duration)}
            </Text>
          </View>

          {/* Right: Time and menu */}
          <View style={styles.rightSection}>
            <Text style={styles.callTime}>{formatCallTime(item.timestamp)}</Text>
            <TouchableOpacity
              style={styles.callActionBtn}
              onPress={() => {
                // Open call options
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="phone-in-talk"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Delete action on select */}
        {isSelected && (
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteCall(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="call-outline" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>No Calls Yet</Text>
      <Text style={styles.emptySubtitle}>Your call history will appear here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
        <Text style={styles.infoBannerText}>All calls E2EE • No server audio • No recording</Text>
      </View>

      {/* Calls List */}
      <FlatList
        data={callHistory}
        renderItem={renderCallItem}
        keyExtractor={(item, index) => item.callId || `${item.id}_${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState()}
        scrollEnabled={true}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Bottom Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Chats')}>
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.tabLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Groups')}>
          <Ionicons name="people-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.tabLabel}>Groups</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.padding,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  addCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.padding,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  listContent: {
    paddingHorizontal: SPACING.padding,
    flexGrow: 1,
  },
  separator: {
    height: 8,
  },
  callItemContainer: {
    marginBottom: 8,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  callItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F4FF',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 24,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  callDirectionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  callInfoSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  callName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  lockIcon: {
    marginLeft: 6,
  },
  callType: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  callTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '500',
  },
  callActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEEAEA',
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    fontFamily: FONTS.bold,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
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
  tabLabel: {
    fontSize: 11,
    color: COLORS.tabInactive,
    fontFamily: FONTS.regular,
  },
});
