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
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme/colors';

const MESSAGES = [
  {
    id: '1',
    text: 'Meet at the usual place.',
    time: '14:20',
    sender: 'received',
  },
  {
    id: '2',
    text: 'Confirmed. ETA 20 min.',
    time: '14:21',
    sender: 'sent',
  },
  {
    id: '3',
    text: 'Updated ETA to 30 min.',
    time: '14:25',
    sender: 'received',
  },
  {
    id: '4',
    text: 'Roger.',
    time: '14:22',
    sender: 'received',
  },
];

export default function SearchChatScreen({ navigation, route }) {
  const [search, setSearch] = useState('');
  const [currentResult, setCurrentResult] = useState(0);

  const filtered = MESSAGES.filter((m) =>
    m.text.toLowerCase().includes(search.toLowerCase())
  );

  const renderMessage = ({ item, index }) => {
    const isActive = index === currentResult;

    return (
      <TouchableOpacity
        style={[
          styles.messageItem,
          isActive && styles.messageItemActive,
        ]}
        onPress={() => setCurrentResult(index)}
      >
        <Text style={[styles.messageText, isActive && styles.messageTextActive]}>
          {item.text}
        </Text>
        <Text style={styles.messageTime}>{item.time}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search in Chat</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={COLORS.gray400}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <TouchableOpacity style={styles.closeBtn}>
          <Text style={styles.closeBtnIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Results Info */}
      {search && filtered.length > 0 && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.navigationBtns}>
            <TouchableOpacity
              onPress={() =>
                setCurrentResult(
                  (prev) => (prev - 1 + filtered.length) % filtered.length
                )
              }
              style={styles.navBtn}
            >
              <Text style={styles.navBtnIcon}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setCurrentResult((prev) => (prev + 1) % filtered.length)
              }
              style={styles.navBtn}
            >
              <Text style={styles.navBtnIcon}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Results List */}
      {search && filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContainer}
          scrollEnabled
        />
      ) : search && filtered.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsIcon}>🔍</Text>
          <Text style={styles.noResultsText}>No messages found</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateText}>Type to search messages</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backArrow: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.gray400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 40,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnIcon: {
    fontSize: 16,
    color: COLORS.gray400,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  navigationBtns: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  navBtnIcon: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  messageItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: SPACING.sm,
  },
  messageItemActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  messageTextActive: {
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: SPACING.sm,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  noResultsText: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
});
