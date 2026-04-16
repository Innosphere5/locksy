import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../../theme/colors';
import { NavBar, PrimaryButton } from '../../component/CIDFlowShared';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import { useCIDContext } from '../../context/CIDContext';

/**
 * Screen 45: My QR Code
 * Displays user's QR code using SVG-based generator (Expo Go compatible)
 */
const Screen45QRCode = ({ onNext, onBack }) => {
  const { userCID, userNickname, userAvatar } = useCIDContext();
  const qrRef = useRef();

  // ─── Share QR Image ────────────────────────────────────────
  const handleShareQR = () => {
    if (!qrRef.current) return;

    // react-native-qrcode-svg provides a toDataURL method
    qrRef.current.toDataURL(async (dataURL) => {
      try {
        const fileName = `Locksy_QR_${userCID}.png`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        // Write to file (dataURL is already base64)
        await FileSystem.writeAsStringAsync(fileUri, dataURL, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: `${userNickname}'s Locksy QR Code`,
            UTI: 'public.png',
          });
        } else {
          // Fallback to text sharing
          await Share.share({
            message: `Scan my QR code or add my CID: ${userCID} on Locksy to connect!`,
          });
        }
      } catch (error) {
        console.error('[QRCode] Share error:', error);
        Alert.alert('Share Failed', 'Unable to share QR code image.');
      }
    });
  };

  const handleCopyCID = () => {
    console.log('CID copied:', userCID);
    Alert.alert('Success', 'CID copied to clipboard');
  };

  return (
    <SafeAreaView style={CIDFlowStyles.safeAreaWhite}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <NavBar title="My QR Code" onBack={onBack} />

      <ScrollView contentContainerStyle={CIDFlowStyles.scrollContent}>
        {/* QR Card */}
        <View style={CIDFlowStyles.qrCard}>
          {/* Avatar */}
          <View style={CIDFlowStyles.avatarCircle}>
            <Text style={CIDFlowStyles.avatarIcon}>{userAvatar || '👤'}</Text>
          </View>

          {/* Username */}
          <Text style={CIDFlowStyles.profileName}>{userNickname || 'Anonymous'}</Text>

          {/* Real SVG-based QR Code */}
          <View style={CIDFlowStyles.qrWrapper}>
            <View style={[CIDFlowStyles.qrInner, { padding: 15, backgroundColor: COLORS.white }]}>
              <QRCode
                value={userCID || 'ERROR'}
                size={200}
                color={COLORS.dark}
                backgroundColor={COLORS.white}
                quietZone={10}
                getRef={(ref) => (qrRef.current = ref)}
              />
              
              {/* Lock Badge overlay managed by CIDFlowStyles */}
              <View style={[CIDFlowStyles.qrOverlay, { position: 'absolute', top: '50%', left: '50%', marginLeft: -15, marginTop: -15 }]}>
                <View style={[CIDFlowStyles.qrLockBadge, { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.white, elevation: 3 }]}>
                  <Text style={{ fontSize: 16 }}>🔒</Text>
                </View>
              </View>
            </View>
          </View>

          {/* CID Below QR */}
          <Text style={CIDFlowStyles.profileCID}>{userCID}</Text>
          <Text style={CIDFlowStyles.profileSub}>
            Scan to add {userNickname} on Locksy
          </Text>
        </View>

        {/* Share QR Button */}
        <PrimaryButton 
          label="📤 Share QR Image" 
          onPress={handleShareQR}
          style={{ marginBottom: 12 }}
        />

        {/* Copy CID Button */}
        <TouchableOpacity 
          style={CIDFlowStyles.secondaryActionBtn}
          onPress={handleCopyCID}
          activeOpacity={0.7}
        >
          <Text style={CIDFlowStyles.secondaryActionText}>
            📋 Copy CID: {userCID}
          </Text>
        </TouchableOpacity>

        {/* Alt Share Method */}
        <Text style={CIDFlowStyles.orShareText}>
          or share CID:{' '}
          <Text style={CIDFlowStyles.orShareCID}>{userCID}</Text>
        </Text>

        {/* Next Action */}
        <PrimaryButton 
          label="Add Contacts →" 
          onPress={onNext}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Screen45QRCode;
