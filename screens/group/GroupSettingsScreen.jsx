import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';
import { useCIDContext } from '../../context/CIDContext';

export default function GroupSettingsScreen({ navigation, route }) {
  const { groupId } = route.params;
  const { groups, removeMember, leaveGroup } = useGroups();
  const { userCID } = useCIDContext();

  const group = groups.find(g => g.groupId === groupId);
  if (!group) {
    navigation.goBack();
    return null;
  }

  const isAdmin = group?.adminId === userCID;

  // AUTO-EXIT: If the group is removed from our list (e.g. we were kicked), go back
  useEffect(() => {
    if (groupId && !groups.some(g => g.groupId === groupId)) {
      console.log(`[GroupSettings] Group ${groupId} no longer exists, exiting...`);
      navigation.navigate('Groups');
    }
  }, [groups, groupId, navigation]);

  const handleLeave = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Leave", 
          style: "destructive", 
          onPress: () => {
            leaveGroup(groupId);
            navigation.navigate('Groups');
          } 
        }
      ]
    );
  };

  const handleUpdateLogo = async () => {
    if (!isAdmin) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const base64Logo = `data:image/jpeg;base64,${result.assets[0].base64}`;
      // Logic to update logo in context/backend could go here
      Alert.alert("Success", "Group logo updated successfully!");
    }
  };

  const handleRemoveMember = (member) => {
    if (!isAdmin) return;
    if (member.cid === userCID) return;

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.nickname}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => removeMember(groupId, member.cid)
        }
      ]
    );
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Text style={styles.avatarText}>{item.nickname?.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.memberName}>{item.nickname}</Text>
          <Text style={styles.memberRole}>{item.cid === group.adminId ? 'Admin' : 'Member'}</Text>
        </View>
      </View>
      
      {isAdmin && item.cid !== userCID && (
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => handleRemoveMember(item)}
        >
          <Ionicons name="person-remove-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Group Profile */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.groupIconLarge} 
            onPress={handleUpdateLogo}
            disabled={!isAdmin}
          >
            {group.groupLogo ? (
              <Image source={{ uri: group.groupLogo }} style={styles.logoImageLarge} />
            ) : (
              <MaterialCommunityIcons name="account-group" size={60} color={COLORS.primary} />
            )}
            {isAdmin && (
              <View style={styles.editLogoBadge}>
                <Ionicons name="camera" size={12} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.groupNameLarge}>{group.name}</Text>
          <Text style={styles.groupDesc}>{group.description || 'No description provided'}</Text>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionCard}>
            {isAdmin && (
              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => navigation.navigate('AddMembers', { groupId })}
              >
                <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="person-add" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.actionText}>Add More Members</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionItem, { borderBottomWidth: 0 }]}
              onPress={handleLeave}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.error + '20' }]}>
                <Ionicons name="log-out" size={22} color={COLORS.error} />
              </View>
              <Text style={[styles.actionText, { color: COLORS.error }]}>Leave Group</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members ({group.members?.length || 0})</Text>
          </View>
          <View style={styles.memberCard}>
            <FlatList
              data={group.members}
              keyExtractor={(item, index) => item.cid ? `member-${item.cid}-${index}` : `member-idx-${index}`}
              renderItem={renderMember}
              scrollEnabled={false}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  backBtn: {
    padding: 4,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...SHADOWS.medium,
  },
  groupIconLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
  },
  logoImageLarge: {
    width: '100%',
    height: '100%',
  },
  editLogoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  groupNameLarge: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  groupDesc: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    marginTop: 4,
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    ...SHADOWS.small,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  memberCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  memberName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  memberRole: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  removeBtn: {
    padding: 8,
  },
});
