import React, { useState, useCallback } from 'react';
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
  Modal,
  SectionList,
  Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme/colors';

const CONTACTS_DATA = [
  { id: '1', name: 'Ghost_Fox', avatar: '🦊', online: true, verified: true, type: 'user', avatarBg: '#EEF2FF' },
  { id: '2', name: 'Shadow_Wolf', avatar: '🐺', online: false, verified: false, type: 'user', avatarBg: '#EDE9FE' },
  { id: '3', name: 'Cipher_Eagle', avatar: '🦅', online: true, verified: true, type: 'user', avatarBg: '#D1FAE5' },
];

const GROUPS_DATA = [
  { id: '4', name: 'OP-SECTOR-7', avatar: '👥', verified: false, type: 'group', avatarBg: '#DBEAFE' },
];

const SECTIONS = [
  {
    title: 'CONTACTS',
    data: CONTACTS_DATA,
  },
  {
    title: 'GROUPS',
    data: GROUPS_DATA,
  },
];

export default function ForwardMessageScreen({ navigation, route }) {
  const message = route?.params?.message || { text: 'Confirmed. ETA 20 min.' };
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter all contacts and groups
  const getAllContacts = () => {
    return CONTACTS_DATA.concat(GROUPS_DATA);
  };

  const filtered = search.trim() === '' 
    ? SECTIONS 
    : [
        {
          title: 'CONTACTS',
          data: CONTACTS_DATA.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase())
          ),
        },
        {
          title: 'GROUPS',
          data: GROUPS_DATA.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase())
          ),
        },
      ].filter(section => section.data.length > 0);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleForward = () => {
    if (selected.length === 0) {
      Alert.alert('No Recipients', 'Please select at least one contact or group to forward to.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmForward = useCallback(() => {
    // Get selected contact names
    const selectedContacts = getAllContacts().filter(c => selected.includes(c.id));
    const contactNames = selectedContacts.map(c => c.name).join(', ');

    // Close modal first
    setShowConfirm(false);

    // Navigate on next frame to avoid state change during navigation
    setTimeout(() => {
      Alert.alert(
        '✓ Message Forwarded',
        `Message forwarded to ${selected.length} recipient${selected.length !== 1 ? 's' : ''}:\n\n${contactNames}`,
        [
          {
            text: 'Done',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    }, 0);
  }, [selected, navigation]);

  const renderContactItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.contactItem,
        selected.includes(item.id) && styles.contactItemSelected,
      ]}
      onPress={() => toggleSelect(item.id)}
      activeOpacity={0.6}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: item.avatarBg }]}>
          <Text style={styles.avatarEmoji}>{item.avatar}</Text>
        </View>
        {item.online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.contactInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.contactStatus}>
          {item.type === 'group' ? 'GROUP' : item.online ? 'Online' : 'Offline'}
        </Text>
      </View>

      <View
        style={[
          styles.checkbox,
          selected.includes(item.id) && styles.checkboxSelected,
        ]}
      >
        {selected.includes(item.id) && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.6}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forward to...</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Forwarding Status Banner */}
      <View style={styles.statusBanner}>
        <Text style={styles.statusLabel}>FORWARDING</Text>
        <Text style={styles.statusText}>
          {message.text || 'Confirmed. ETA 20 min.'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts or groups..."
          placeholderTextColor={COLORS.gray400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Contacts/Groups List with Sections */}
      <SectionList
        sections={filtered}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item }) => renderContactItem({ item })}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        scrollEnabled
        stickySectionHeadersEnabled={false}
      />

      {/* Forward Button - Fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.forwardBtn,
            !selected.length && styles.forwardBtnDisabled,
          ]}
          onPress={handleForward}
          disabled={!selected.length}
          activeOpacity={0.7}
        >
          <Text style={styles.forwardBtnText}>
            {selected.length > 0 ? `Forward to ${selected.length}` : 'Forward'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Forward Message?</Text>
            <Text style={styles.confirmText}>
              Send to {selected.length} recipient{selected.length !== 1 ? 's' : ''}
            </Text>

            <View style={styles.messagePreview}>
              <View style={styles.previewIconRow}>
                <Text style={styles.previewIcon}>💬</Text>
                <Text style={styles.previewLabel}>Message</Text>
              </View>
              <Text style={styles.previewText} numberOfLines={3}>
                {message.text || 'Confirmed. ETA 20 min.'}
              </Text>
            </View>

            <View style={styles.dialogButtonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConfirm(false)}
                activeOpacity={0.6}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmForward}
                activeOpacity={0.6}
              >
                <Text style={styles.confirmBtnText}>Forward</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statusBanner: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: SPACING.xs,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 40,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    padding: 0,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    gap: SPACING.md,
  },
  contactItemSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  contactInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  verifiedBadge: {
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
  },
  contactStatus: {
    fontSize: 12,
    color: COLORS.gray400,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
  },
  forwardBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  forwardBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  forwardBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDialog: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  confirmText: {
    fontSize: 14,
    color: COLORS.gray500,
    lineHeight: 20,
  },
  messagePreview: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  previewIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  previewIcon: {
    fontSize: 14,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
    fontWeight: '500',
  },
  dialogButtonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
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
  statusBanner: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 40,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
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
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    gap: SPACING.md,
  },
  contactItemSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  verifiedBadge: {
    fontSize: 14,
    color: COLORS.success,
  },
  contactStatus: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
  },
  forwardBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  forwardBtnDisabled: {
    opacity: 0.4,
  },
  forwardBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDialog: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  confirmText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  messagePreview: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
});
