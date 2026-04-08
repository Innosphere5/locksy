import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Share,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { NavBar, PrimaryButton } from '../../component/CIDFlowShared';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import { useCIDContext } from '../../context/CIDContext';

/**
 * QR Code Component - Generates deterministic pattern from CID
 */
const QRCodeMock = ({ cid }) => {
  const GRID_SIZE = 15;
  const CELL = 10;

  const generatePattern = () => {
    const cells = Array(GRID_SIZE * GRID_SIZE).fill(false);
    const cidHash = cid.split('').reduce((h, c, i) => {
      return ((h << 5) - h) + c.charCodeAt(0) + i;
    }, 0);

    // Finder patterns (3 corners) - QR code requirement
    const setCorner = (startRow, startCol) => {
      for (let r = startRow; r < startRow + 7; r++) {
        for (let c = startCol; c < startCol + 7; c++) {
          if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            const isBorder = r === startRow + 6 || c === startCol + 6;
            const isInner = r > startRow + 1 && r < startRow + 5 && 
                          c > startCol + 1 && c < startCol + 5;
            cells[r * GRID_SIZE + c] = !isBorder && !isInner;
          }
        }
      }
    };

    setCorner(0, 0);
    setCorner(0, GRID_SIZE - 7);
    setCorner(GRID_SIZE - 7, 0);

    // Timing patterns
    for (let i = 8; i < GRID_SIZE - 8; i++) {
      cells[6 * GRID_SIZE + i] = i % 2 === 0;
      cells[i * GRID_SIZE + 6] = i % 2 === 0;
    }

    // Data area with CID distribution
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const r = Math.floor(i / GRID_SIZE);
      const c = i % GRID_SIZE;

      const isReserved = 
        (r < 9 && c < 9) || 
        (r < 9 && c >= GRID_SIZE - 8) || 
        (r >= GRID_SIZE - 8 && c < 9);

      if (!isReserved && !cells[i]) {
        cells[i] = (cidHash * (i + 1) * 7919) % 17 > 8;
      }
    }

    return cells;
  };

  const cells = generatePattern();

  return (
    <View style={CIDFlowStyles.qrWrapper}>
      <View style={CIDFlowStyles.qrInner}>
        {Array.from({ length: GRID_SIZE }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {Array.from({ length: GRID_SIZE }, (_, col) => (
              <View
                key={col}
                style={{
                  width: CELL,
                  height: CELL,
                  backgroundColor: cells[row * GRID_SIZE + col]
                    ? COLORS.dark
                    : COLORS.white,
                  borderWidth: 0.5,
                  borderColor: COLORS.border,
                }}
              />
            ))}
          </View>
        ))}
        {/* Lock Badge Overlay */}
        <View style={CIDFlowStyles.qrOverlay}>
          <View style={CIDFlowStyles.qrLockBadge}>
            <Text style={CIDFlowStyles.qrLockIcon}>🔒</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * Screen 45: My QR Code
 * Displays user's QR code with share and copy options
 */
const Screen45QRCode = ({ onNext, onBack }) => {
  const { userCID } = useCIDContext();
  const userName = 'Phantom_X';
  const userAvatar = '👤';

  const handleShareQR = async () => {
    try {
      await Share.share({
        message: `Scan my QR code or add my CID ${userCID} on Locksy to connect!`,
        title: `${userName}'s Locksy QR Code`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyCID = () => {
    console.log('CID copied:', userCID);
  };

  return (
    <SafeAreaView style={CIDFlowStyles.safeAreaWhite}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <NavBar title="My QR Code" onBack={onBack} rightIcon="☐" />

      <ScrollView contentContainerStyle={CIDFlowStyles.scrollContent}>
        {/* QR Card */}
        <View style={CIDFlowStyles.qrCard}>
          {/* Avatar */}
          <View style={CIDFlowStyles.avatarCircle}>
            <Text style={CIDFlowStyles.avatarIcon}>{userAvatar}</Text>
          </View>

          {/* Username */}
          <Text style={CIDFlowStyles.profileName}>{userName}</Text>

          {/* QR Code */}
          <QRCodeMock cid={userCID} />

          {/* CID Below QR */}
          <Text style={CIDFlowStyles.profileCID}>{userCID}</Text>
          <Text style={CIDFlowStyles.profileSub}>
            Scan to add {userName} on Locksy
          </Text>
        </View>

        {/* Share QR Button */}
        <PrimaryButton 
          label="📤 Share QR Code" 
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
