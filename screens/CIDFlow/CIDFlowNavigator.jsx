import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Text } from "react-native";
import { COLORS } from "../../theme/colors";
import { useCIDContext } from "../../context/CIDContext";

// Import all screens
import Screen42GeneratingCID from "./Screen42GeneratingCID";
import Screen43CIDGenerated from "./Screen43CIDGenerated";
import Screen44MyIdentity from "./Screen44MyIdentity";
import Screen45QRCode from "./Screen45QRCode";
import Screen46Scanner from "./Screen46Scanner";
import Screen47ContactFound from "./Screen47ContactFound";
import Screen48AddByCID from "./Screen48AddByCID";
import Screen49ContactAdded from "./Screen49ContactAdded";

/**
 * CID Flow Navigator
 * Orchestrates screens 42-49 (CID Identity Flow)
 * Handles navigation state, screen transitions, and context management
 *
 * Flows:
 * Onboarding: 42 (Generating) → 43 (Generated) → 44 (Identity) → 45 (QR)
 * Add Contact: 44 (Identity) → 45 (QR) → 46 (Scanner) → 48 (Enter CID) → 47 (Found) → 49 (Added)
 */
const CIDFlowNavigatorContent = ({ onFlowComplete, isAddContact = false, startScreen, route }) => {
  // Use startScreen if provided, else determine based on isAddContact
  const initialScreen = startScreen || (isAddContact ? 44 : 42);
  const [screen, setScreen] = useState(initialScreen);

  const handleScreenChange = (screenNumber) => {
    setScreen(screenNumber);
  };

  const handleFlowComplete = () => {
    if (onFlowComplete) {
      onFlowComplete();
    } else {
      // Default: reset to Screen 42
      setScreen(42);
    }
  };

  // Screen components map
  const screens = {
    42: <Screen42GeneratingCID onNext={() => handleScreenChange(43)} />,
    43: <Screen43CIDGenerated onNext={() => handleScreenChange(44)} />,
    44: (
      <Screen44MyIdentity
        onNext={() => handleScreenChange(45)}
        onBack={() => handleScreenChange(43)}
      />
    ),
    45: (
      <Screen45QRCode
        onNext={() => handleScreenChange(46)}
        onBack={() => handleScreenChange(44)}
      />
    ),
    46: (
      <Screen46Scanner
        onNext={() => handleScreenChange(47)} // Scan Found -> Goes to Screen 47
        onBack={startScreen === 46 ? handleFlowComplete : () => handleScreenChange(45)}
        route={route}
      />
    ),
    47: (
      <Screen47ContactFound
        onNext={() => handleScreenChange(49)}
        onBack={() => handleScreenChange(46)}
      />
    ),
    48: (
      <Screen48AddByCID
        onNext={() => handleScreenChange(47)}
        onBack={() => handleScreenChange(46)}
      />
    ),
    49: <Screen49ContactAdded onNext={handleFlowComplete} />,
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Current Screen */}
      {screens[screen]}

      {/* Dev Navigation Strip - Remove in production */}
      {__DEV__ && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(15,23,42,0.95)",
            paddingVertical: 6,
            maxHeight: 50,
          }}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {Object.keys(screens).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => handleScreenChange(Number(s))}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
                marginHorizontal: 3,
                backgroundColor:
                  screen === Number(s)
                    ? COLORS.primary
                    : "rgba(255,255,255,0.1)",
                minWidth: 40,
              }}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

/**
 * CIDFlowNavigator - Main Export
 * Wraps all screens with CIDProvider for context management
 *
 * Can be called with route params:
 * - isOnboarding: boolean - if called from onboarding
 * - isAddContact: boolean - if called from chat screen to add contacts
 * - onFlowComplete: function - callback when flow completes
 */
const CIDFlowNavigator = ({ route, navigation }) => {
  const params = route?.params || {};
  const isOnboarding = params.isOnboarding || false;
  const isAddContact = params.isAddContact || false;
  const startScreen = params.startScreen || null;

  const handleFlowComplete = () => {
    if (navigation) {
      if (isOnboarding) {
        // From onboarding, go to next step
        navigation.navigate("SetupMasterPassword");
      } else if (navigation.canGoBack()) {
        // From chat screen, go back if possible
        navigation.goBack();
      } else {
        // Fallback: if we can't go back, go to main dashboard
        navigation.navigate("Chats");
      }
    }
  };

  return (
    <CIDFlowNavigatorContent
      onFlowComplete={handleFlowComplete}
      isAddContact={isAddContact}
      startScreen={startScreen}
      route={route}
    />
  );
};

export default CIDFlowNavigator;
