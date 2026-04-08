import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width: screenWidth } = Dimensions.get('screen');

/**
 * VaultScreen - Screen 50
 * File storage with auto-delete after 15 days
 * Shows all vault items with encryption status
 */
export default function VaultScreen({ navigation }) {
  const [vaultItems] = useState([
    { id: '1', name: 'img_secure_01', type: 'image', size: '2.4 MB', daysLeft: 12, pinned: true },
    { id: '2', name: 'vid_brief.mp4', type: 'video', size: '3 days', daysLeft: 3, pinned: false },
    { id: '3', name: 'ops_report.pdf', type: 'pdf', size: '3 days', daysLeft: 3, pinned: false },
    { id: '4', name: 'chat_export', type: 'archive', size: '14 days', daysLeft: 14, pinned: false },
  ]);

  const [activeTab, setActiveTab] = useState('All');

  const renderVaultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.vaultItem}
      onPress={() => Alert.alert('View File', `Opening ${item.name}...`)}
      activeOpacity={0.7}
    >
      <View style={styles.itemIcon}>
        {item.type === 'image' && (
          <MaterialCommunityIcons name="image" size={24} color={COLORS.primary} />
        )}
        {item.type === 'video' && (
          <MaterialCommunityIcons name="video" size={24} color={COLORS.primary} />
        )}
        {item.type === 'pdf' && (
          <MaterialCommunityIcons name="file-pdf-box" size={24} color={COLORS.error} />
        )}
        {item.type === 'archive' && (
          <MaterialCommunityIcons name="folder-zip" size={24} color={COLORS.warning} />
        )}
        {item.pinned && (
          <View style={styles.itemPin}>
            <MaterialCommunityIcons name="pin" size={12} color={COLORS.warning} />
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSize}>{item.daysLeft} days left</Text>
      </View>
      <TouchableOpacity 
        style={styles.itemMenu}
        onPress={() => Alert.alert('Item Menu', 'More options')}
      >
        <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🔒 Vault</Text>
          <Text style={styles.headerSubtitle}>Auto-delete after 15 days · in-app only</Text>
        </View>
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

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['All', 'Photos', 'Files', 'Chats'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vault Items */}
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FlatList
          data={vaultItems}
          renderItem={renderVaultItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.encryptionInfo}>
          <MaterialCommunityIcons name="lock" size={16} color={COLORS.encryptionText} />
          <Text style={styles.encryptionText}>All content is AES-256 encrypted</Text>
        </View>
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity 
          style={styles.bottomTab}
          onPress={() => navigation.navigate('Chats')}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.bottomTabLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bottomTab}
          onPress={() => navigation.navigate('Groups')}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.bottomTabLabel}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.bottomTab, styles.bottomTabActive]}
          activeOpacity={0.7}
        >
          <Ionicons name="lock-closed" size={22} color={COLORS.primary} />
          <Text style={[styles.bottomTabLabel, styles.bottomTabLabelActive]}>Vault</Text>
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
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body3,
    color: COLORS.warning,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginRight: SPACING.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  vaultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    position: 'relative',
  },
  itemPin: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemSize: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  itemMenu: {
    padding: SPACING.sm,
  },
  encryptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.encryptionBg,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.encryptionBorder,
  },
  encryptionText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.encryptionText,
    marginLeft: SPACING.sm,
  },
  bottomTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingBottom: SPACING.md,
  },
  bottomTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  bottomTabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  bottomTabLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  bottomTabLabelActive: {
    color: COLORS.primary,
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
});
