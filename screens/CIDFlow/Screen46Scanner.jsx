import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { NavBar } from '../../component/CIDFlowShared';
import { CIDFlowStyles } from '../common/CIDFlowStyles';

/**
 * Screen 46: QR Scanner Camera
 * Shows scanner viewport with pulsing frame
 * Option to enter CID manually
 */
const Screen46Scanner = ({ onNext, onBack }) => {
  const pulseAnim = useRef(new Animated.Value(0.7)).current;
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    // Pulsing animation for scanner frame
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate scan progress
    const scanTimer = setInterval(() => {
      setScanProgress((prev) => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(scanTimer);
  }, [pulseAnim]);

  return (
    <SafeAreaView style={CIDFlowStyles.safeAreaDark}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <NavBar 
        title="Scan QR Code" 
        onBack={onBack} 
        rightIcon="💡" 
        dark
      />

      {/* Scanner Viewport */}
      <View style={CIDFlowStyles.scannerViewport}>
        <Animated.View
          style={[CIDFlowStyles.scannerFrame, { opacity: pulseAnim }]}
        >
          {/* Corner Markers */}
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
          ].map((style, i) => (
            <View
              key={i}
              style={[
                CIDFlowStyles.scannerCorner,
                style,
                { borderColor: COLORS.success },
              ]}
            />
          ))}

          {/* Scan Line */}
          <View 
            style={[
              CIDFlowStyles.scanLine,
              { 
                top: `${scanProgress}%`,
              }
            ]} 
          />
        </Animated.View>
      </View>

      {/* Bottom Panel */}
      <View style={CIDFlowStyles.scannerBottom}>
        <Text style={CIDFlowStyles.scannerHint}>Point at a Locksy QR Code</Text>
        <Text style={CIDFlowStyles.scannerSub}>
          Scan contact's QR to add securely
        </Text>
        <Text style={CIDFlowStyles.scannerOr}>or enter CID manually</Text>
        
        <TouchableOpacity
          style={CIDFlowStyles.enterCIDBtn}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={CIDFlowStyles.enterCIDText}>Enter CID: _ _ _ _ _ _</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Screen46Scanner;
