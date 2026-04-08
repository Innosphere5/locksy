import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupsProvider } from './context/GroupsContext';
import { CallsProvider } from './context/CallsContext';

// ── Onboarding ────────────────────────────────────────────────────────────────
import SplashScreen from './onboardings/SplashScreen';
import OnboardingScreen from './onboardings/OnboardingScreen';
import CIDScreen from './onboardings/CIDScreen';
import SetupMasterPassword from './onboardings/SetupMasterPassword';
import SetupNickname from './onboardings/SetupNickname';
import SetupProfilePhoto from './onboardings/SetupProfilePhoto';

// ── Main App Screens ──────────────────────────────────────────────────────────
import WelcomeBackScreen from './screens/auth/WelcomeBackScreen';
import ChatsScreen from './screens/chat/ChatsScreen';
import ChatMessageScreen from './screens/chat/ChatMessageScreen';
import NewMessageScreen from './screens/chat/NewMessageScreen';
import UnlockChatScreen from './screens/chat/UnlockChatScreen';
import WrongPasswordScreen from './screens/auth/WrongPasswordScreen';
import AccessDeniedScreen from './screens/auth/AccessDeniedScreen';

// ── Additional Screens ────────────────────────────────────────────────────────
import ForwardMessageScreen from './screens/chat/ForwardMessageScreen';
import SearchChatScreen from './screens/chat/SearchChatScreen';

// ── Group Chat Screens ────────────────────────────────────────────────────────
import GroupScreen from './screens/group/GroupScreen';
import GroupChatScreen from './screens/group/GroupChatScreen';
import CreateGroupScreen from './screens/group/CreateGroupScreen';
import GroupInfoScreen from './screens/group/GroupInfoScreen';
import ApproveMembersScreen from './screens/group/ApproveMembersScreen';
import EmptyGroupScreen from './screens/group/EmptyGroupScreen';

// ── Call Screens ──────────────────────────────────────────────────────────
import CallsScreen from './screens/call/CallsScreen';
import IncomingCallScreen from './screens/call/IncomingCallScreen';
import VoiceCallScreen from './screens/call/VoiceCallScreen';
import VideoCallScreen from './screens/call/VideoCallScreen';

// ── CID Identity Flow (Screens 42-49) ─────────────────────────────────────────
import CIDFlowNavigator from './screens/CIDFlow/CIDFlowNavigator';

// ── Vault Screens (50-54) ─────────────────────────────────────────────────────
import VaultScreen from './screens/vault/VaultScreen';
import VaultEmptyScreen from './screens/vault/VaultEmptyScreen';
import VaultFileExpiryModal from './screens/vault/VaultFileExpiryModal';
import SecurityCenterScreen from './screens/settings/SecurityCenterScreen';

// ── Settings & Profile Screens (55-59) ────────────────────────────────────────
import SettingsScreen from './screens/settings/SettingsScreen';
import EditNicknameScreen from './screens/settings/EditNicknameScreen';
import ChangePasswordScreen from './screens/settings/ChangePasswordScreen';
import BiometricSetupScreen from './screens/settings/BiometricSetupScreen';

// ── Privacy & Notifications Screens (60-62) ──────────────────────────────────
import PresenceVisibilityScreen from './screens/settings/PresenceVisibilityScreen';
import NotificationsSettingsScreen from './screens/settings/NotificationsSettingsScreen';

// ── Contact & Verification Screens (63-64) ──────────────────────────────────
import ContactInfoScreen from './screens/common/ContactInfoScreen';
import VerifySecurityScreen from './screens/settings/VerifySecurityScreen';

// ── Contact Actions Screens (65-69) ──────────────────────────────────────────
import MuteContactScreen from './screens/settings/MuteContactScreen';
import ShareCIDScreen from './screens/common/ShareCIDScreen';
import DeletedMessageStatesModal from './screens/modals/DeletedMessageStatesModal';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GroupsProvider>
      <CallsProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{ headerShown: false, animation: 'fade' }}
          >
        {/* ── Onboarding Flow ── */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="CID" component={CIDScreen} />
        <Stack.Screen name="SetupMasterPassword" component={SetupMasterPassword} />
        <Stack.Screen name="SetupNickname" component={SetupNickname} />
        <Stack.Screen name="SetupProfilePhoto" component={SetupProfilePhoto} />

        {/* ── Auth ── */}
        <Stack.Screen
          name="WelcomeBack"
          component={WelcomeBackScreen}
          options={{ animation: 'fade' }}
        />

        {/* ── Main ── */}
        <Stack.Screen
          name="Chats"
          component={ChatsScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="ChatMessage"
          component={ChatMessageScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="NewMessage"
          component={NewMessageScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />

        {/* ── Chat Features ── */}
        <Stack.Screen
          name="Forward"
          component={ForwardMessageScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Search"
          component={SearchChatScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        {/* ── Group Chat ── */}
        <Stack.Screen
          name="Groups"
          component={GroupScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="GroupChat"
          component={GroupChatScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="CreateGroup"
          component={CreateGroupScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="GroupInfo"
          component={GroupInfoScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ApproveMembers"
          component={ApproveMembersScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="EmptyGroups"
          component={EmptyGroupScreen}
          options={{ animation: 'fade' }}
        />

        {/* ── Security ── */}
        <Stack.Screen
          name="UnlockChat"
          component={UnlockChatScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="WrongPassword"
          component={WrongPasswordScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="AccessDenied"
          component={AccessDeniedScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />

        {/* ── Call Screens ── */}
        <Stack.Screen
          name="Calls"
          component={CallsScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="IncomingCall"
          component={IncomingCallScreen}
          options={{ animation: 'fade', presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen
          name="VoiceCall"
          component={VoiceCallScreen}
          options={{ animation: 'fade', presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen
          name="VideoCall"
          component={VideoCallScreen}
          options={{ animation: 'fade', presentation: 'fullScreenModal', gestureEnabled: false }}
        />

        {/* ── CID Flow (Identity Verification) ── */}
        <Stack.Screen
          name="CIDFlow"
          component={CIDFlowNavigator}
          options={{ animation: 'fade', gestureEnabled: false }}
        />

        {/* ── Vault Screens (50-54) ── */}
        <Stack.Screen
          name="Vault"
          component={VaultScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="VaultEmpty"
          component={VaultEmptyScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="VaultFileExpiry"
          component={VaultFileExpiryModal}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="SecurityCenter"
          component={SecurityCenterScreen}
          options={{ animation: 'slide_from_right' }}
        />

        {/* ── Settings & Profile Screens (55-59) ── */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="EditNickname"
          component={EditNicknameScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="BiometricSetup"
          component={BiometricSetupScreen}
          options={{ animation: 'slide_from_right' }}
        />

        {/* ── Privacy & Notifications Screens (60-62) ── */}
        <Stack.Screen
          name="PresenceVisibility"
          component={PresenceVisibilityScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="NotificationsSettings"
          component={NotificationsSettingsScreen}
          options={{ animation: 'slide_from_right' }}
        />

        {/* ── Contact & Verification Screens (63-64) ── */}
        <Stack.Screen
          name="ContactInfo"
          component={ContactInfoScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="VerifySecurity"
          component={VerifySecurityScreen}
          options={{ animation: 'slide_from_right' }}
        />

        {/* ── Contact Actions Screens (65-69) ── */}
        <Stack.Screen
          name="MuteContact"
          component={MuteContactScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="ShareCID"
          component={ShareCIDScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="DeletedMessageStates"
          component={DeletedMessageStatesModal}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
      </Stack.Navigator>
        </NavigationContainer>
      </CallsProvider>
    </GroupsProvider>
  );
}