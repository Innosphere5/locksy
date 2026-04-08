import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

/**
 * DeletedMessageStatesModal - Screen 68
 * Show various deleted message states and indicators
 */
export default function DeletedMessageStatesModal({ visible, onClose }) {
  const [selectedContext, setSelectedContext] = useState('1v1');

  const deletedStates = [
    {
      id: 'my-deletion',
      title: 'You deleted this message',
      icon: 'delete-outline',
      timestamp: '16:21',
      description: 'Deleted for you',
      color: COLORS.warning,
    },
    {
      id: 'deleted-for-all',
      title: 'Ghost_Fox deleted a message',
      icon: 'delete-outline',
      timestamp: '14:22',
      description: 'Deleted for everyone',
      color: COLORS.error,
    },
    {
      id: 'expired',
      title: 'Message expired',
      icon: 'clock-outline',
      timestamp: '13:15',
      description: 'Auto-deleted after 1 minute',
      color: COLORS.warning,
    },
    {
      id: 'opened-once',
      title: 'Opened once · deleted',
      icon: 'eye-off-outline',
      timestamp: '12:00',
      description: 'View-once message was shown',
      color: COLORS.primary,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.overlay} />

        {/* Bottom Sheet */}
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Deleted Message States</Text>
            <Text style={styles.subtitle}>How Locksy displays deleted messages</Text>
          </View>

          {/* Tab Selection */}
          <View style={styles.tabContainer}>
            {['1v1', 'Group'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  selectedContext === tab && styles.tabActive
                ]}
                onPress={() => setSelectedContext(tab)}
              >
                <Text style={[
                  styles.tabText,
                  selectedContext === tab && styles.tabTextActive
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Message Examples */}
            <View style={styles.messagesContainer}>
              {deletedStates.map((state) => (
                <View key={state.id} style={styles.messageCard}>
                  {/* Deleted Message */}
                  <View style={styles.deletedMessageBubble}>
                    <MaterialCommunityIcons 
                      name={state.icon} 
                      size={24} 
                      color={state.color}
                      style={{ marginRight: SPACING.md }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.messageText, { color: state.color }]}>
                        {state.title}
                      </Text>
                    </View>
                    <Text style={styles.timestamp}>{state.timestamp}</Text>
                  </View>

                  {/* Description */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDescription}>{state.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>STATES LEGEND</Text>

              <View style={styles.legendItem}>
                <MaterialCommunityIcons 
                  name="delete-outline" 
                  size={20} 
                  color={COLORS.warning}
                />
                <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                  <Text style={styles.legendLabel}>You deleted this message</Text>
                  <Text style={styles.legendDescription}>
                    Message deleted from your view only
                  </Text>
                </View>
              </View>

              <View style={styles.legendItem}>
                <MaterialCommunityIcons 
                  name="delete-outline" 
                  size={20} 
                  color={COLORS.error}
                />
                <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                  <Text style={styles.legendLabel}>Deleted for everyone</Text>
                  <Text style={styles.legendDescription}>
                    Message removed from all devices (within 48h)
                  </Text>
                </View>
              </View>

              <View style={styles.legendItem}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={20} 
                  color={COLORS.warning}
                />
                <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                  <Text style={styles.legendLabel}>Auto-deleted</Text>
                  <Text style={styles.legendDescription}>
                    Message expired based on timer setting
                  </Text>
                </View>
              </View>

              <View style={styles.legendItem}>
                <MaterialCommunityIcons 
                  name="eye-off-outline" 
                  size={20} 
                  color={COLORS.primary}
                />
                <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                  <Text style={styles.legendLabel}>View-once deleted</Text>
                  <Text style={styles.legendDescription}>
                    Message shown once then auto-deleted
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Users still see "X deleted a message" placeholder for context, but message content is never retrievable.
              </Text>
            </View>

            <View style={styles.bottomSpace} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    ...StyleSheet.absoluteFills,
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dragHandle: {
    position: 'absolute',
    top: SPACING.sm,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
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
    marginRight: SPACING.md,
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  messagesContainer: {
    marginTop: SPACING.lg,
  },
  messageCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  deletedMessageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.gray50,
  },
  messageText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '500',
  },
  timestamp: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
    marginLeft: SPACING.md,
  },
  cardFooter: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cardDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  section: {
    marginVertical: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  legendLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  legendDescription: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  infoText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.encryptionText,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  bottomSpace: {
    height: SPACING.xl,
  },
});
