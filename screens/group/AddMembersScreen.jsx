import React, { useState, useMemo } from 'react';
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
import { deriveSharedSecret, encryptAESGCM } from '../../utils/cryptoEngine';

export default function AddMembersScreen({ navigation, route }) {
  const { getGroup, sendGroupInvite } = useGroups();
  const { contacts, userCID, searchContactByNickname } = useCIDContext();
  const groupId = route?.params?.groupId;
  
  const group = getGroup(groupId);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [usernameToAdd, setUsernameToAdd] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleAddByUsername = async () => {
    if (!usernameToAdd.trim()) return;
    try {
      setIsSearching(true);
      const result = await searchContactByNickname(usernameToAdd.trim());
      if (result && result.otherUser) {
        const user = result.otherUser;
        // Check if already in group
        if (group?.members?.some(m => m.cid === user.cid)) {
          Alert.alert('Info', 'User is already a member of this group');
          return;
        }
        // Check if already in selection
        if (selectedMembers.some(m => m.cid === user.cid)) {
          Alert.alert('Info', 'User already in selection');
        } else {
          setSelectedMembers(prev => [...prev, user]);
          setUsernameToAdd('');
          Alert.alert('Success', `Added ${user.nickname} to invite list`);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'User not found or connection error');
    } finally {
      setIsSearching(false);
    }
  };

  // Filter contacts not already in group and match search query
  const availableContacts = useMemo(() => {
    let filtered = contacts.filter(c => !group?.members?.some(m => m.cid === c.cid));
    if (searchQuery.trim()) {
      filtered = filtered.filter(c => 
        c.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cid?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [contacts, group, searchQuery]);

  const toggleMember = (contact) => {
    if (selectedMembers.some(m => m.cid === contact.cid)) {
      setSelectedMembers(prev => prev.filter(m => m.cid !== contact.cid));
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  };

  const handleAdd = async () => {
    if (selectedMembers.length === 0) return;

    try {
      setIsAdding(true);
      
      for (const member of selectedMembers) {
        let publicKey = member.publicKey;

        if (!publicKey) {
          console.log(`[AddMembers] Member ${member.nickname} missing public key, fetching...`);
          try {
            const result = await socketService.searchContact(member.cid);
            if (result && result.otherUser && result.otherUser.publicKey) {
              publicKey = result.otherUser.publicKey;
            }
          } catch (e) {
            console.error(`[AddMembers] Failed to fetch key for ${member.nickname}`, e);
          }
        }

        if (!publicKey) {
          Alert.alert("Error", `Cannot invite ${member.nickname}: Missing Public Key`);
          continue;
        }

        await sendGroupInvite(groupId, member.cid, member.nickname, publicKey);
      }

      Alert.alert("Invites Sent", "Group invitations have been sent to selected members.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to send invites");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Members</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ paddingHorizontal: SIZES.padding, paddingTop: 10 }}>
          <Text style={styles.sectionLabel}>ADD BY USERNAME</Text>
          <View style={styles.searchBarContainer}>
            <View style={styles.inputWrapperSmall}>
              <MaterialCommunityIcons name="at" size={18} color={COLORS.primary} />
              <TextInput
                style={styles.inputSmall}
                value={usernameToAdd}
                onChangeText={setUsernameToAdd}
                placeholder="Enter exact username"
                placeholderTextColor={COLORS.placeholder}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity 
              style={[styles.findBtn, (!usernameToAdd.trim() || isSearching) && styles.findBtnDisabled]}
              onPress={handleAddByUsername}
              disabled={!usernameToAdd.trim() || isSearching}
            >
              <Text style={styles.findBtnText}>{isSearching ? '...' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchSection}>
          <Text style={styles.sectionLabel}>SELECT FROM CONTACTS</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
              placeholderTextColor={COLORS.placeholder}
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
          </View>
        </View>
        
        {availableContacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No available contacts to add.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {availableContacts.map((contact, i) => {
              const isSelected = selectedMembers.some(m => m.cid === contact.cid);
              return (
                <TouchableOpacity 
                  key={contact.cid}
                  style={styles.memberRow}
                  onPress={() => toggleMember(contact)}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>{contact.nickname?.[0] || '?'}</Text>
                  </View>
                  <Text style={styles.memberName}>{contact.nickname}</Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.addBtn, (selectedMembers.length === 0 || isAdding) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={selectedMembers.length === 0 || isAdding}
        >
          <Text style={styles.addBtnText}>
            {isAdding ? "Adding..." : `Add ${selectedMembers.length} Member${selectedMembers.length === 1 ? '' : 's'}`}
          </Text>
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
    paddingBottom: 100,
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
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
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emptyCard: {
    marginHorizontal: SIZES.padding,
    padding: 30,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    marginLeft: 6,
    padding: 0,
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    marginTop: 4,
    alignItems: 'center',
  },
  inputWrapperSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.cardBg,
  },
  inputSmall: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    padding: 0,
  },
  findBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  findBtnDisabled: {
    opacity: 0.5,
  },
  findBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
