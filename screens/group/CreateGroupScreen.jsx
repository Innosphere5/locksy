import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useGroups } from '../../context/GroupsContext';

export default function CreateGroupScreen({ navigation }) {
  const { createGroup } = useGroups();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('closed'); // 'closed' | 'approval'
  const [isCreating, setIsCreating] = useState(false);

  // Sample members for demo (can be replaced with real members from contacts)
  const SAMPLE_MEMBERS = [
    { id: '1', name: 'Shadow_Wolf', nickname: 'Shadow_Wolf', avatar: '🐺' },
    { id: '2', name: 'Iron_Mask', nickname: 'Iron_Mask', avatar: '🎭' },
    { id: '3', name: 'CipherX', nickname: 'CipherX', avatar: '🔐' },
    { id: '4', name: 'NightOwl', nickname: 'NightOwl', avatar: '🦉' },
  ];

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return;
    }

    try {
      setIsCreating(true);

      // For demo: include sample members, in production these would come from user selection
      const newGroup = createGroup({
        name: groupName.trim(),
        description: description.trim(),
        mode,
        creator: 'You',
        members: SAMPLE_MEMBERS, // In production, replace with selected members
      });

      // Navigate to group chat
      setTimeout(() => {
        navigation.goBack();
        navigation.navigate('GroupChat', {
          groupId: newGroup.id,
          group: newGroup,
        });
      }, 500);
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

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createBtn,
              (!groupName.trim() || !description.trim() || isCreating) && styles.createBtnDisabled,
            ]}
            onPress={handleCreate}
            activeOpacity={0.85}
            disabled={!groupName.trim() || !description.trim() || isCreating}
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
    marginBottom: 32,
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
});