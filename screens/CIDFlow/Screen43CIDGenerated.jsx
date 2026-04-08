import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import { PrimaryButton, InfoRow } from '../../component/CIDFlowShared';
import { useCIDContext } from '../../context/CIDContext';

/**
 * Screen 43: CID Generated
 * Shows success animation and displays newly generated CID
 * Provides info about CID usage and security
 */
const Screen43CIDGenerated = ({ onNext }) => {
  const { userCID } = useCIDContext();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const infoItems = [
    { icon: '🔑', text: 'Used internally for encryption only' },
    { icon: '👤', text: 'Never shown in group chats' },
    { icon: '👁️', text: 'Others only see your nickname' },
  ];

  return (
    <SafeAreaView style={CIDFlowStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={CIDFlowStyles.scrollContent}>
        <View style={CIDFlowStyles.centeredContent}>
          {/* Success Circle Animation */}
          <Animated.View
            style={[
              CIDFlowStyles.successCircle,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={CIDFlowStyles.checkMark}>✓</Text>
          </Animated.View>

          {/* Heading */}
          <Text style={[CIDFlowStyles.headingLg, { marginTop: 16 }]}>
            Your CID is ready
          </Text>

          {/* CID Card */}
          <Animated.View
            style={[CIDFlowStyles.cidCard, { opacity: fadeAnim }]}
          >
            <Text style={CIDFlowStyles.cidCardLabel}>YOUR CID</Text>
            
            {/* CID Pill Display */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {userCID.split('').map((char, i) => (
                <View
                  key={i}
                  style={{
                    width: 44,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: COLORS.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: COLORS.primary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '800',
                      color: COLORS.primary,
                    }}
                  >
                    {char}
                  </Text>
                </View>
              ))}
            </View>

            {/* Full CID Text */}
            <Text style={CIDFlowStyles.cidFullText}>{userCID}</Text>
            <Text style={CIDFlowStyles.cidSubNote}>
              6 characters · letters + numbers
            </Text>
          </Animated.View>

          {/* Info Items */}
          <Animated.View style={[{ width: '100%', opacity: fadeAnim }]}>
            {infoItems.map((item, i) => (
              <InfoRow key={i} icon={item.icon} text={item.text} />
            ))}
          </Animated.View>

          {/* Continue Button */}
          <PrimaryButton
            label="Continue →"
            onPress={onNext}
            style={{ marginTop: 32, width: '100%' }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Screen43CIDGenerated;
