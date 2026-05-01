import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';

export default function GroupInviteModal() {
  const { groupInvites, acceptGroupInvite, rejectGroupInvite } = useGroups();
  
  if (groupInvites.length === 0) return null;
  
  const currentInvite = groupInvites[0];

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.content}>
          <StatusBar barStyle="light-content" />
          
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="account-group" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Group Invitation</Text>
              <Text style={styles.subtitle}>You've been invited to join a group</Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Group Name</Text>
                <Text style={styles.infoValue}>{currentInvite.groupName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Invited By</Text>
                <Text style={styles.infoValue}>{currentInvite.fromNickname}</Text>
              </View>
            </View>

            <View style={styles.securityWarning}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
              <Text style={styles.securityText}>End-to-end encrypted group</Text>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.declineBtn}
                onPress={() => rejectGroupInvite(currentInvite.groupId)}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptBtn}
                onPress={() => acceptGroupInvite(currentInvite)}
              >
                <Text style={styles.acceptBtnText}>Join Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  infoBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },
  securityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 32,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  declineBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
});
