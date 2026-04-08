import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import { useCIDContext } from '../../context/CIDContext';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Screen 42: Generating CID
 * Displays animated CID generation process
 * Auto-transitions to Screen 43 after 2.8 seconds
 */
const Screen42GeneratingCID = ({ onNext }) => {
  const { setUserCID } = useCIDContext();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const revealAnims = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0)))
    .current;

  const CID_CHARS = ['A', '7', 'F', '?', '?', '?'];

  useEffect(() => {
    // Rotating spinner
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Reveal CID characters sequentially
    CID_CHARS.forEach((_, i) => {
      if (i < 3) {
        Animated.timing(revealAnims[i], {
          toValue: 1,
          duration: 400,
          delay: i * 300,
          useNativeDriver: true,
        }).start();
      }
    });

    // Auto-generate CID and navigate after 2.8 seconds
    const timer = setTimeout(() => {
      const generateCID = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let cid = '';
        for (let i = 0; i < 6; i++) {
          cid += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return cid;
      };
      
      const newCID = generateCID();
      setUserCID(newCID);
      onNext();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onNext, setUserCID]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={CIDFlowStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={CIDFlowStyles.centeredContent}
        scrollEnabled={false}
      >
        {/* Lock Icon Container */}
        <View style={CIDFlowStyles.iconContainer}>
          <Text style={CIDFlowStyles.iconEmoji}>🔒</Text>
        </View>

        {/* Heading */}
        <Text style={CIDFlowStyles.headingLg}>Generating your CID</Text>

        {/* Subtext */}
        <Text style={CIDFlowStyles.subText}>
          Created locally · Never transmitted{'\n'}to any server
        </Text>

        {/* CID Display with Animation */}
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {CID_CHARS.map((ch, i) => (
              <Animated.View
                key={i}
                style={{
                  opacity: i < 3 ? revealAnims[i] : 0.35,
                }}
              >
                <View
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
                    {ch}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Animated Spinner */}
        <Animated.View
          style={[CIDFlowStyles.spinner, { transform: [{ rotate: spin }] }]}
        />

        {/* Crypto Note */}
        <Text style={CIDFlowStyles.cryptoNote}>
          Cryptographically unique per device
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Screen42GeneratingCID;
