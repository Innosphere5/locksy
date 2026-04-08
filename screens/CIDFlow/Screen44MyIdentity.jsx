import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { NavBar } from '../../component/CIDFlowShared';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import { useCIDContext } from '../../context/CIDContext';

/**
 * Screen 44: My Identity
 * Displays user profile with CID
 * Actions: Copy CID, Show QR Code, Share CID
 */
const Screen44MyIdentity = ({ onNext, onBack }) => {
  const { userCID } = useCIDContext();
  const userName = 'Phantom_X';
  const userAvatar = '👤';

  const handleCopyCID = async () => {
    try {
      await Clipboard.setString(userCID);
      Alert.alert('Copied', `CID copied to clipboard: ${userCID}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy CID');
      console.error('Copy error:', error);
    }
  };

  const handleShareCID = async () => {
    try {
      await Share.share({
        message: `Add me on Locksy! My CID: ${userCID}\n\nI'm using Locksy for secure messaging.`,
        title: 'My Locksy CID',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={CIDFlowStyles.safeAreaWhite}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <NavBar title="My Identity" onBack={onBack} />

      <ScrollView contentContainerStyle={CIDFlowStyles.scrollContent}>
        {/* Profile Card */}
        <View style={CIDFlowStyles.profileCard}>
          {/* Avatar Circle */}
          <View style={CIDFlowStyles.avatarCircle}>
            <Text style={CIDFlowStyles.avatarIcon}>{userAvatar}</Text>
          </View>

          {/* Username */}
          <Text style={CIDFlowStyles.profileName}>{userName}</Text>

          {/* CID */}
          <Text style={CIDFlowStyles.profileCID}>{userCID}</Text>

          {/* Subtitle */}
          <Text style={CIDFlowStyles.profileSub}>Share to receive messages</Text>
        </View>

        {/* Action Rows */}
        {[
          {
            id: 'copy',
            icon: '📋',
            label: 'Copy CID',
            badge: userCID,
            arrow: false,
            onPress: handleCopyCID,
          },
          {
            id: 'qr',
            icon: '▦',
            label: 'Show QR Code',
            badge: null,
            arrow: true,
            onPress: onNext,
          },
          {
            id: 'share',
            icon: '↗',
            label: 'Share CID',
            badge: null,
            arrow: true,
            onPress: handleShareCID,
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={CIDFlowStyles.actionRow}
            activeOpacity={0.7}
            onPress={item.onPress}
          >
            <Text style={CIDFlowStyles.actionIcon}>{item.icon}</Text>
            <Text style={CIDFlowStyles.actionLabel}>{item.label}</Text>
            <View style={{ flex: 1 }} />
            {item.badge && (
              <Text style={CIDFlowStyles.actionBadge}>{item.badge}</Text>
            )}
            {item.arrow && (
              <Text style={CIDFlowStyles.actionArrow}>›</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Warning Box */}
        <View style={CIDFlowStyles.warningBox}>
          <Text style={CIDFlowStyles.warningText}>
            ⚠️ Only share with people you trust.{'\n'}Anyone with your CID can message you.
          </Text>
        </View>

        {/* Info Box */}
        <View style={CIDFlowStyles.infoBox}>
          <Text style={CIDFlowStyles.infoBoxText}>
            💡 Your CID is unique to this device and never leaves your phone. It's used for end-to-end encryption.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Screen44MyIdentity;
