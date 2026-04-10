import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
  ScrollView,
  Dimensions,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCIDContext } from '../../context/CIDContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width: screenWidth } = Dimensions.get('screen');

/**
 * EditNicknameScreen - Screen 56
 * Edit user's nickname with validation and previous nicknames
 */
export default function EditNicknameScreen({ navigation }) {
  const { userNickname, updateNickname, userAvatar, updateAvatar } = useCIDContext();
  const [nickname, setNickname] = useState(userNickname || '');
  const [pickedAvatar, setPickedAvatar] = useState(userAvatar);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPickedAvatar(result.assets[0].uri);
    }
  };

  const previousNicknames = [
    { id: '1', name: userNickname || 'Locksy_User', label: 'Current' },
  ];

  const handleSaveNickname = async () => {
    if (nickname.length < 3) {
      Alert.alert('Invalid', 'Nickname must be at least 3 characters');
      return;
    }
    setIsSaving(true);
    
    // Natively wait for local context/storage modification
    await updateNickname(nickname.trim());
    if (pickedAvatar !== userAvatar) {
      await updateAvatar(pickedAvatar);
    }
    
    setIsSaving(false);
    Alert.alert('Success', 'Profile updated successfully!');
    navigation.goBack();
  };

  const handleRestore = (name) => {
    setNickname(name);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Nickname</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={styles.headerAction}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
            <View style={[styles.avatarPreview, { overflow: 'hidden', marginBottom: 0 }]}>
              {pickedAvatar ? (
                 <Image source={{ uri: pickedAvatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                 <Text style={styles.avatarText}>{nickname[0]?.toUpperCase() || '?'}</Text>
              )}
            </View>
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.previewLabel}>Preview · Visible to all contacts</Text>
        </View>

        {/* Nickname Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new nickname"
            value={nickname}
            onChangeText={setNickname}
            selectionColor={COLORS.primary}
            placeholderTextColor={COLORS.placeholder}
            maxLength={30}
            editable={!isSaving}
            multiline={false}
          />
          <View style={styles.countContainer}>
            <Text style={styles.charCount}>
              {nickname.length}-24 characters · letters, numbers, _
            </Text>
          </View>
        </View>

        {/* Previous Nicknames */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREVIOUS</Text>
          {previousNicknames.map((item) => (
            <View key={item.id} style={styles.previousItem}>
              <View style={styles.previousInfo}>
                <View style={styles.previousAvatar}>
                  <MaterialCommunityIcons name="account" size={16} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.previousName}>{item.name}</Text>
                  <Text style={styles.previousLabel}>{item.label}</Text>
                </View>
              </View>
              {item.label !== 'Current' && (
                <TouchableOpacity 
                  onPress={() => handleRestore(item.name)}
                  style={styles.restoreBtn}
                >
                  <Text style={styles.restoreBtnText}>Restore</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveNickname}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Nickname'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
  },
  headerAction: {
    ...TYPOGRAPHY.body1,
    color: COLORS.primary,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 32,
  },
  previewLabel: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  countContainer: {
    alignItems: 'flex-end',
  },
  charCount: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  previousItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  previousInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previousAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  previousName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    fontWeight: '600',
  },
  previousLabel: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  restoreBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
  },
  restoreBtnText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  saveButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
});
