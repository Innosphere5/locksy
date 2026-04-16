import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Animated,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { PrimaryButton, ContactCard } from '../../component/CIDFlowShared';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import { useCIDContext } from '../../context/CIDContext';
import socketService from '../../utils/socketService';

const { height: SCREEN_H } = Dimensions.get('window');

/**
 * Screen 47: Contact Found
 * Shows scanned contact details with verification badge
 * User taps "Add" to proceed to Screen 49
 */
const Screen47ContactFound = ({ onNext, onBack }) => {
  const { currentContact, addContact } = useCIDContext();
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAddContact = async () => {
    if (contact && contact.cid) {
      try {
        console.log(`[Screen47] Direct adding contact from QR: ${contact.cid}`);
        socketService.addContactDirect(contact.cid);
        
        onNext(); // Go to Screen 49 (Request Sent)
      } catch (err) {
        console.error('[Screen47] Failed to add contact:', err.message);
        Alert.alert('Add Failed', 'Could not add connection. Please try again.');
      }
    }
  };

  // Mock contact data if not provided
  const contact = currentContact || {
    cid: 'A7F3K9',
    nickname: 'Ghost_Fox',
    avatar: '🦊',
    verified: true,
  };

  const displayName = contact.nickname || contact.name || 'Unknown';

  return (
    <SafeAreaView style={CIDFlowStyles.safeAreaDark}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Camera Feed Area */}
      <View style={CIDFlowStyles.scannerViewport}>
        <View style={CIDFlowStyles.scannerFrameGreen}>
          {/* Corner Markers - Green for success */}
          {[
            { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
            { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
            {
              bottom: 0,
              left: 0,
              borderBottomWidth: 3,
              borderLeftWidth: 3,
            },
            {
              bottom: 0,
              right: 0,
              borderBottomWidth: 3,
              borderRightWidth: 3,
            },
          ].map((s, i) => (
            <View
              key={i}
              style={[
                CIDFlowStyles.scannerCorner,
                s,
                { borderColor: COLORS.success },
              ]}
            />
          ))}

          {/* Success Dot Indicator */}
          <View style={CIDFlowStyles.scanSuccessDot}>
            <Text style={{ color: COLORS.white, fontSize: 14 }}>✓</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet with Contact Info */}
      <Animated.View
        style={[
          CIDFlowStyles.bottomSheet,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Heading */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>
          Contact Found!
        </Text>

        {/* Contact Card */}
        <ContactCard
          name={displayName}
          cid={contact.cid}
          avatar={contact.avatar}
          verified={contact.verified}
          style={{ marginBottom: 20 }}
        />

        {/* E2EE Hint */}
        <View style={CIDFlowStyles.e2eeHint}>
          <Text style={CIDFlowStyles.e2eeHintText}>
            🔐 E2EE keys will be exchanged automatically
          </Text>
        </View>

        {/* Add Button */}
        <PrimaryButton
          label={`Add ${displayName}`}
          onPress={handleAddContact}
          style={{ marginTop: 20 }}
        />

        {/* Cancel */}
        <Text 
          style={CIDFlowStyles.cancelText}
          onPress={onBack}
        >
          Cancel
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Screen47ContactFound;
