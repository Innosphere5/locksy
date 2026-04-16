import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from 'expo-image-manipulator';
import jsQR from 'jsqr';
import { decode as decodeJpeg } from 'jpeg-js';
import { Buffer } from 'buffer';

import { COLORS } from '../../theme/colors';
import { NavBar, PrimaryButton } from '../../component/CIDFlowShared';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import socketService from '../../utils/socketService';
import { useCIDContext } from '../../context/CIDContext';

/**
 * Screen 46: QR Scanner Camera
 * Implements real camera scanning and gallery image decoding (Expo Go compatible)
 */
const Screen46Scanner = ({ onNext, onBack, route }) => {
  const { setCurrentContact, userCID } = useCIDContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(0.7)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // ─── AutoPick Logic (if navigated from shortcut) ────────────
  useEffect(() => {
    if (route?.params?.autoPick) {
      // Small delay to ensure permissions and UI are ready
      setTimeout(() => {
        handlePickImage();
      }, 500);
    }
  }, [route?.params?.autoPick]);

  // ─── Animations ──────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // ─── Handle Decoded CID ──────────────────────────────────────
  const handleDecodedCID = async (cid) => {
    if (!cid || isProcessing) return;
    
    // Validate format (6 chars alphanumeric)
    const cleanCID = cid.trim().toUpperCase();
    if (cleanCID === userCID) {
      Alert.alert('Invalid', 'You cannot add yourself.');
      setScanned(false);
      return;
    }

    setIsProcessing(true);
    try {
      console.log(`[Scanner] Searching for CID: ${cleanCID}`);
      const response = await socketService.searchContact(cleanCID);
      
      if (response && response.otherUser) {
        console.log('[Scanner] Search response success:', response.otherUser.nickname);
        setCurrentContact(response.otherUser);
        onNext(); // Go to Screen 47 (Contact Found)
      } else {
        console.warn('[Scanner] Request success but no user returned');
        Alert.alert('Not Found', 'The user associated with this QR code could not be found.');
        setScanned(false);
      }
    } catch (err) {
      console.error('[Scanner] Search fatal error:', err.message);
      Alert.alert('Search Error', err.message || 'Failed to reach discovery server.');
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Live Camera Scan ────────────────────────────────────────
  const handleBarCodeScanned = ({ data }) => {
    if (scanned || isProcessing) return;
    
    // Diagnostic signal: prove the camera sees a QR
    console.log('[Scanner] Raw signal detected:', data);
    
    if (data && data.length >= 6) {
      setScanned(true);
      console.log('[Scanner] Valid signal captured, starting search...');
      handleDecodedCID(data);
    }
  };

  // ─── Pick from Gallery & Decode ──────────────────────────────
  const handlePickImage = async () => {
    try {
      console.log('[Scanner] Launching gallery picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || !result.assets[0].uri) {
        console.log('[Scanner] Picker canceled');
        return;
      }

      setIsProcessing(true);
      const imageUri = result.assets[0].uri;
      console.log('[Scanner] Image picked:', imageUri);

      // 1. Standardize image to JPEG with higher resolution for better decoding
      console.log('[Scanner] Manipulating image...');
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1000 } }], 
        { format: ImageManipulator.SaveFormat.JPEG, compress: 1 }
      );

      // 2. Read as base64 (Using direct string 'base64' to avoid enum undefined issues)
      console.log('[Scanner] Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
        encoding: 'base64',
      });

      // 3. Decode JPEG to raw pixels
      console.log('[Scanner] Decoding JPEG buffer...');
      const rawBuffer = Buffer.from(base64, 'base64');
      const { data, width, height } = decodeJpeg(rawBuffer, { useTArray: true });
      console.log(`[Scanner] Image decoded: ${width}x${height}`);

      // 4. Decode QR from pixels using jsQR
      console.log('[Scanner] Detecting QR code...');
      const clampedData = new Uint8ClampedArray(data);
      const qrCode = jsQR(clampedData, width, height, {
        inversionAttempts: "dontInvert", // Faster processing
      });

      if (qrCode) {
        console.log('[Scanner] QR Decoded successfully:', qrCode.data);
        handleDecodedCID(qrCode.data);
      } else {
        console.warn('[Scanner] No QR code detected in image');
        Alert.alert(
          'No Code Found', 
          'Locksy could not find a QR code in this photo. Please ensure the QR is clear and not too far away.'
        );
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('[Scanner] Gallery scan fatal error:', err);
      Alert.alert('Processing Error', `Failed to read the image: ${err.message || 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  // ─── Navigation Fix ──────────────────────────────────────────
  const handleBack = () => {
    // If we started directly at the scanner (from AddContact shortcut),
    // we want to return directly to the caller (AddContact screen).
    if (route?.params?.startScreen === 46) {
      if (onBack && typeof onBack === 'function') {
        // We still call the prop-based onBack but we could also use navigation.goBack()
        // In CIDFlowNavigator, onBack is handleScreenChange(45).
        // Let's force a real navigation back if we came from outside.
        onBack(); 
      }
    } else {
      onBack();
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator color={COLORS.primary}/></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access is required to scan QR codes.</Text>
        <PrimaryButton label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <SafeAreaView style={CIDFlowStyles.safeAreaDark}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      {/* 
        Navigation Note: 
        If startScreen is 46, the NavBar "onBack" will trigger the flow change (going to 45).
        However, the user wants it to go to "Add Contact".
        So we'll use conditional prop overriding.
      */}
      <NavBar 
        title="Scan QR Code" 
        onBack={route?.params?.startScreen === 46 ? undefined : onBack} 
        dark 
      />

      {/* Camera Viewport */}
      <View style={CIDFlowStyles.scannerViewport}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        
        {/* Pulsing UI Overlay */}
        <Animated.View
          style={[CIDFlowStyles.scannerFrame, { opacity: pulseAnim }]}
        >
          {/* Corner Markers */}
          {[
            { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
            { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
            { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
            { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
          ].map((style, i) => (
            <View key={i} style={[CIDFlowStyles.scannerCorner, style, { borderColor: COLORS.success }]} />
          ))}

          {/* Animated Scan Line */}
          <Animated.View 
            style={[
              CIDFlowStyles.scanLine,
              { 
                top: scanLineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </Animated.View>

        {isProcessing && (
          <View style={styles.overlayLoader}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.loaderText}>Processing...</Text>
          </View>
        )}
      </View>

      {/* Bottom Panel */}
      <View style={CIDFlowStyles.scannerBottom}>
        <Text style={CIDFlowStyles.scannerHint}>Point at a Locksy QR Code</Text>
        
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handlePickImage}
          disabled={isProcessing}
        >
          <Text style={styles.galleryButtonText}>📂 Import from Gallery</Text>
        </TouchableOpacity>

        <Text style={CIDFlowStyles.scannerOr}>or enter CID manually</Text>
        
        <TouchableOpacity
          style={CIDFlowStyles.enterCIDBtn}
          onPress={() => onNext()}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          <Text style={CIDFlowStyles.enterCIDText}>Enter CID: _ _ _ _ _ _</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
  },
  permissionText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.text,
  },
  overlayLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: COLORS.white,
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  galleryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  galleryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Screen46Scanner;
