import React, { useRef, useEffect } from "react";
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
  Animated,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme/colors";
import { NavBar } from "../../component/CIDFlowShared";
import { CIDFlowStyles } from "../common/CIDFlowStyles";
import { useCIDContext } from "../../context/CIDContext";

/**
 * Screen 44: My Identity
 * Displays user profile with CID
 * Actions: Copy CID, Show QR Code, Share CID
 * Features: Animated character reveal, staggered action rows
 */
const Screen44MyIdentity = ({ onNext, onBack }) => {
  const { userCID, setUserCID, userNickname, userAvatar } = useCIDContext();
  const navigation = useNavigation();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const charAnims = useRef(
    (userCID || "").split("").map(() => new Animated.Value(0)),
  ).current;
  const actionAnims = useRef(
    [0, 1, 2].map(() => new Animated.Value(0)),
  ).current;

  React.useEffect(() => {
    // Aggressively flush CID to secure store
    if (userCID) setUserCID(userCID);
  }, [userCID, setUserCID]);

  // Animate on mount
  useEffect(() => {
    // Initial container fade and slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate each character in CID
      if (charAnims.length > 0) {
        Animated.stagger(
          60,
          charAnims.map((anim) =>
            Animated.spring(anim, {
              toValue: 1,
              friction: 6,
              tension: 120,
              useNativeDriver: true,
            }),
          ),
        ).start(() => {
          // Then animate action rows
          Animated.stagger(
            80,
            actionAnims.map((anim) =>
              Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ),
          ).start();
        });
      } else {
        // Animate action rows if no CID yet
        Animated.stagger(
          80,
          actionAnims.map((anim) =>
            Animated.timing(anim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ),
        ).start();
      }
    });
  }, [userCID]);

  const handleCopyCID = async () => {
    try {
      await Clipboard.setString(userCID);
      Alert.alert("Copied", `CID copied to clipboard: ${userCID}`);
    } catch (error) {
      Alert.alert("Error", "Failed to copy CID");
      console.error("Copy error:", error);
    }
  };

  const handleShareCID = async () => {
    try {
      await Share.share({
        message: `Add me on Locksy! My CID: ${userCID}\n\nI'm using Locksy for secure messaging.`,
        title: "My Locksy CID",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <SafeAreaView style={CIDFlowStyles.safeAreaWhite}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <NavBar title="My Identity" onBack={onBack} />

      <Animated.ScrollView
        contentContainerStyle={CIDFlowStyles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Profile Card */}
        <View style={CIDFlowStyles.profileCard}>
          {/* Avatar Circle */}
          <View style={CIDFlowStyles.avatarCircle}>
            <Text style={CIDFlowStyles.avatarIcon}>{userAvatar}</Text>
          </View>

          {/* Username */}
          <Text style={CIDFlowStyles.profileName}>{userNickname || 'Anonymous'}</Text>

          {/* CID with Character Animations */}
          <View style={styles.cidDisplayContainer}>
            {(userCID || "").split("").map((char, i) => (
              <Animated.Text
                key={i}
                style={[
                  CIDFlowStyles.profileCID,
                  {
                    opacity: charAnims[i],
                    transform: [
                      {
                        scale: charAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {char}
              </Animated.Text>
            ))}
          </View>

          {/* Subtitle */}
          <Text style={CIDFlowStyles.profileSub}>
            Share to receive messages
          </Text>
        </View>

        {/* Action Rows with Staggered Animation */}
        {[
          {
            id: "copy",
            icon: "📋",
            label: "Copy CID",
            badge: userCID,
            arrow: false,
            onPress: handleCopyCID,
          },
          {
            id: "qr",
            icon: "▦",
            label: "Show QR Code",
            badge: null,
            arrow: true,
            onPress: onNext,
          },
          {
            id: "share",
            icon: "↗",
            label: "Share CID",
            badge: null,
            arrow: true,
            onPress: handleShareCID,
          },
        ].map((item, index) => (
          <Animated.View
            key={item.id}
            style={{
              opacity: actionAnims[index],
              transform: [
                {
                  translateY: actionAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
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
              {item.arrow && <Text style={CIDFlowStyles.actionArrow}>›</Text>}
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Warning Box */}
        <View style={CIDFlowStyles.warningBox}>
          <Text style={CIDFlowStyles.warningText}>
            ⚠️ Only share with people you trust.{"\n"}Anyone with your CID can
            message you.
          </Text>
        </View>

        {/* Info Box */}
        <View style={CIDFlowStyles.infoBox}>
          <Text style={CIDFlowStyles.infoBoxText}>
            💡 Your CID is unique to this device and never leaves your phone.
            It's used for end-to-end encryption.
          </Text>
        </View>

        {/* Skip Container */}
        <TouchableOpacity
          style={{
            marginTop: 32,
            marginBottom: 32,
            alignItems: "center",
            paddingVertical: 16,
          }}
          onPress={() => navigation.navigate("SetupMasterPassword")}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: COLORS.primary,
            }}
          >
            Skip and Continue Setup →
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cidDisplayContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
});

export default Screen44MyIdentity;
