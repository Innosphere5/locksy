import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';

const CONTACTS = [
  {
    id: '1',
    name: 'Ghost_Fox',
    status: 'Online now',
    online: true,
    avatar: '🦊',
    avatarBg: '#EEF2FF',
    verified: true,
    e2ee: false,
  },
  {
    id: '2',
    name: 'Shadow_Wolf',
    status: 'Last seen 2h ago',
    online: false,
    avatar: '🐺',
    avatarBg: '#EDE9FE',
    verified: false,
    e2ee: true,
  },
  {
    id: '3',
    name: 'Cipher_Eagle',
    status: 'Last seen 5h ago',
    online: false,
    avatar: '🦅',
    avatarBg: '#D1FAE5',
    verified: false,
    e2ee: true,
  },
];

function ContactRow({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: item.avatarBg }]}>
        <Text style={styles.avatarEmoji}>{item.avatar}</Text>
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={[styles.contactStatus, item.online && styles.onlineStatus]}>
          {item.online ? '● ' : ''}{item.status}
        </Text>
      </View>
      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      )}
      {item.e2ee && (
        <View style={styles.e2eeBadge}>
          <Text style={styles.e2eeText}>E2EE</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function NewMessageScreen({ navigation }) {
  const [search, setSearch] = useState('');

  const filtered = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtn}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search or enter CID..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      {/* Section Label */}
      <Text style={styles.sectionLabel}>CONTACTS</Text>

      {/* Contacts List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ContactRow
            item={item}
            onPress={() => navigation.navigate('ChatMessage', { name: item.name, avatar: item.avatar })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />

      {/* Add by CID */}
      <TouchableOpacity style={styles.addCIDBtn} activeOpacity={0.8}>
        <View style={styles.cidIcon}>
          <Text style={{ fontSize: 16, color: '#6366F1' }}>🪪</Text>
        </View>
        <Text style={styles.addCIDText}>Add contact by CID...</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4 },
  backArrow: {
    fontSize: 22,
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  doneBtn: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    padding: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  listContent: { paddingBottom: 16 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 24 },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  contactStatus: {
    fontSize: 13,
    color: '#94A3B8',
  },
  onlineStatus: { color: '#22C55E' },
  verifiedBadge: {
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
  },
  e2eeBadge: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  e2eeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  separator: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 78 },
  addCIDBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 24 : 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  cidIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCIDText: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '600',
  },
});