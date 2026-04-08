import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { PrimaryButton, ContactCard, CheckItem } from '../../component/CIDFlowShared';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import { useCIDContext } from '../../context/CIDContext';

/**
 * Screen 49: Contact Added
 * Final success screen showing added contact
 * Displays confirmation checkmarks for security steps
 */
const Screen49ContactAdded = ({ onNext }) => {
  const { currentContact, contacts } = useCIDContext();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const listAnims = useRef([0, 1, 2].map(() => new Animated.Value(0)))
    .current;

  useEffect(() => {
    // Success circle scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();

    // Checklist item animations
    listAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 400 + i * 150,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Use current contact or mock data
  const contact = currentContact || {
    cid: 'A7F3K9',
    name: 'Ghost_Fox',
    avatar: '🦊',
    verified: true,
  };

  const checkItems = [
    'CID verified - identity confirmed',
    'E2EE keys exchanged',
    'Ready to send encrypted messages',
  ];

  const handleComplete = () => {
    // Navigate back to main app or chat
    if (onNext) {
      onNext();
    }
  };

  return (
    <SafeAreaView style={CIDFlowStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={CIDFlowStyles.scrollContent}>
        <View style={CIDFlowStyles.centeredContent}>
          {/* Success Circle */}
          <Animated.View
            style={[
              CIDFlowStyles.successCircle,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={CIDFlowStyles.checkMark}>✓</Text>
          </Animated.View>

          {/* Heading */}
          <Text style={[CIDFlowStyles.headingLg, { marginTop: 20 }]}>
            Contact Added!
          </Text>

          {/* Contact Card */}
          <ContactCard
            name={contact.name}
            cid={contact.cid}
            avatar={contact.avatar}
            verified={contact.verified}
            style={{ marginTop: 20 }}
          />

          {/* Checklist */}
          <View style={{ width: '100%', marginTop: 20 }}>
            {checkItems.map((item, i) => (
              <Animated.View
                key={i}
                style={[{ opacity: listAnims[i] }]}
              >
                <CheckItem text={item} />
              </Animated.View>
            ))}
          </View>

          {/* Start Chatting Button */}
          <PrimaryButton
            label="💬 Start Chatting"
            onPress={handleComplete}
            style={{ marginTop: 32, width: '100%' }}
          />

          {/* Contact Count Info */}
          <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 16 }}>
            You now have {contacts.length} secure contact{contacts.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Screen49ContactAdded;
