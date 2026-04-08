import React, { useState } from 'react';
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
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';

/**
 * VaultScreen - Screen 50
 * File storage with auto-delete after 15 days
 * 2-column grid layout matching design perfectly
 */
export default function VaultScreen({ navigation }) {
  const [vaultItems] = useState([
    { id: '1', name: 'img_secure_01', type: 'image', size: '2.4 MB', daysLeft: 12, pinned: true },
    { id: '2', name: 'vid_brief.mp4', type: 'video', size: '3 days', daysLeft: 3, pinned: true },
    { id: '3', name: 'ops_report.pdf', type: 'pdf', size: '3 days', daysLeft: 3, pinned: false },
    { id: '4', name: 'chat_export', type: 'archive', size: '14 days', daysLeft: 14, pinned: true },
  ]);

  const [activeTab, setActiveTab] = useState('All');

  const renderVaultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.vaultItem}
      onPress={() => Alert.alert('View File', `Opening ${item.name}...`)}
      activeOpacity={0.75}
    >
      <View style={styles.itemIconContainer}>
        {item.type === 'image' && (
          <Ionicons name="image" size={28} color={COLORS.primary} />
        )}
        {item.type === 'video' && (
          <Ionicons name="play-circle" size={28} color={COLORS.primary} />
        )}
        {item.type === 'pdf' && (
          <MaterialCommunityIcons name="file-pdf-box" size={28} color={COLORS.error} />
        )}
        {item.type === 'archive' && (
          <MaterialCommunityIcons name="folder-zip" size={28} color={COLORS.warning} />
        )}
        
        {item.pinned && (
          <View style={styles.pinBadge}>
            <MaterialCommunityIcons name="pin" size={10} color={COLORS.warning} />
          </View>
        )}
      </View>

      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.itemDays}>
        <Ionicons name="time" size={10} color={COLORS.textMuted} /> {item.daysLeft} days
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>Vault</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => Alert.alert('Add', 'Select media to add to vault')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
        <Text style={styles.warningText}>Auto-delete after 15 days · in-app only</Text>
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

      {/* Vault Grid */}
      <FlatList
        data={vaultItems}
        renderItem={renderVaultItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.tabContent}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Chats')}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.navLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Groups')}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={22} color={COLORS.tabInactive} />
          <Text style={styles.navLabel}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          activeOpacity={0.7}
        >
          <Ionicons name="lock-closed" size={22} color={COLORS.primary} />
          <Text style={[styles.navLabel, { color: COLORS.primary }]}>Vault</Text>
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
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  lockIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  vaultItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  itemIconContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  pinBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  itemDays: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: COLORS.background,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.tabInactive,
    fontWeight: '500',
  },
});
