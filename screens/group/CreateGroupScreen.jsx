import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';
import { useCIDContext } from '../../context/CIDContext';

export default function CreateGroupScreen({ navigation }) {
  const { createGroup } = useGroups();
  const { contacts, searchContactByNickname } = useCIDContext();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('closed'); // 'closed' | 'approval'
  const [isCreating, setIsCreating] = useState(false);
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
        if (selectedMembers.some(m => m.cid === user.cid)) {
          Alert.alert('Info', 'User already in selection');
        } else {
          setSelectedMembers(prev => [...prev, user]);
          setUsernameToAdd('');
          Alert.alert('Success', `Added ${user.nickname} to group selection`);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'User not found or connection error');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    return contacts.filter(c => 
      c.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cid?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  const toggleMember = (contact) => {
    if (selectedMembers.some(m => m.cid === contact.cid)) {
      setSelectedMembers(prev => prev.filter(m => m.cid !== contact.cid));
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    try {
      setIsCreating(true);

      const newGroup = await createGroup({
        name: groupName.trim(),
        description: description.trim(),
        mode,
        members: selectedMembers,
      });

      // Navigate to group chat
      navigation.goBack();
      navigation.navigate('GroupChat', {
        groupId: newGroup.groupId,
        group: newGroup,
      });
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subHeading}>NAME + DESCRIPTION REQUIRED</Text>
          <Text style={styles.title}>Create Secure Group</Text>

          {/* Avatar Picker */}
          <TouchableOpacity style={styles.avatarPicker} activeOpacity={0.7}>
            <MaterialCommunityIcons name="account-group" size={36} color={COLORS.primary} />
            <View style={styles.avatarAddIcon}>
              <Ionicons name="add" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {/* Group Name */}
          <Text style={styles.label}>
            Group Name <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="account-group"
              size={18}
              color={COLORS.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor={COLORS.placeholder}
              returnKeyType="next"
              editable={!isCreating}
            />
          </View>

          {/* Description */}
          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Field team Alpha secure coordination"
            placeholderTextColor={COLORS.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isCreating}
          />

          {/* Mode Selector */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'closed' && styles.modeBtnActive]}
              onPress={() => setMode('closed')}
              activeOpacity={0.8}
              disabled={isCreating}
            >
              <Text style={styles.modeEmoji}>🔒</Text>
              <Text style={[styles.modeBtnLabel, mode === 'closed' && styles.modeBtnLabelActive]}>
                Closed
              </Text>
              <Text style={styles.modeBtnSub}>Admin adds only</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeBtn, mode === 'approval' && styles.modeBtnApprovalActive]}
              onPress={() => setMode('approval')}
              activeOpacity={0.8}
              disabled={isCreating}
            >
              <Text style={styles.modeEmoji}>🤝</Text>
              <Text
                style={[styles.modeBtnLabel, mode === 'approval' && styles.modeBtnLabelApproval]}
              >
                Approval
              </Text>
              <Text style={styles.modeBtnSub}>Invite + approve</Text>
            </TouchableOpacity>
          </View>

          {/* Add by Username */}
          <Text style={styles.label}>Add Member by Username</Text>
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

          {/* Member Selection */}
          <View style={styles.memberHeader}>
            <Text style={styles.label}>Select Members ({selectedMembers.length})</Text>
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

          {filteredContacts.length === 0 ? (
            <View style={styles.emptyContacts}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching contacts found.' : 'No contacts found. Add contacts first.'}
              </Text>
            </View>
          ) : (
            <View style={styles.contactsList}>
              {filteredContacts.map((contact) => {
                const isSelected = selectedMembers.some(m => m.cid === contact.cid);
                return (
                  <TouchableOpacity
                    key={contact.cid}
                    style={[styles.contactItem, isSelected && styles.contactItemActive]}
                    onPress={() => toggleMember(contact)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.avatarText}>{contact.nickname?.[0] || '?'}</Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.nickname}</Text>
                      {!contact.publicKey && (
                        <Text style={styles.missingKeyText}>Missing Public Key (E2EE Warning)</Text>
                      )}
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createBtn,
              (!groupName.trim() || !description.trim() || selectedMembers.length === 0 || isCreating) && styles.createBtnDisabled,
            ]}
            onPress={handleCreate}
            activeOpacity={0.85}
            disabled={!groupName.trim() || !description.trim() || selectedMembers.length === 0 || isCreating}
          >
            <Text style={styles.createBtnText}>
              {isCreating ? 'Creating...' : 'Create Group'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 24,
  },
  avatarPicker: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  avatarAddIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    marginBottom: 6,
    marginTop: 4,
  },
  required: {
    color: COLORS.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.inputBg,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    padding: 0,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    backgroundColor: COLORS.inputBg,
    minHeight: 80,
    marginBottom: 24,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
  },
  modeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  modeBtnApprovalActive: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  modeEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  modeBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
  },
  modeBtnLabelActive: {
    color: COLORS.primary,
  },
  modeBtnLabelApproval: {
    color: COLORS.warning,
  },
  modeBtnSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  contactsList: {
    gap: 10,
    marginBottom: 32,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 12,
  },
  contactItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  contactAvatar: {
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
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  missingKeyText: {
    fontSize: 10,
    color: COLORS.danger,
    fontFamily: FONTS.regular,
    marginTop: 2,
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
  emptyContacts: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    marginBottom: 32,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
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
    marginBottom: 20,
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
    backgroundColor: COLORS.inputBg,
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