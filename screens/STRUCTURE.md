# Screens Folder Structure

This document outlines the organized structure of the screens folder for improved scalability and readability.

## Folder Organization

### 📱 **auth/** - Authentication Screens
Contains screens related to user authentication and access control.
- `AccessDeniedScreen.jsx` - Access denied screen (Screen 41)
- `WelcomeBackScreen.jsx` - Welcome back after login (Screen 39)
- `WrongPasswordScreen.jsx` - Wrong password error screen (Screen 40)

### 💬 **chat/** - Chat & Messaging Screens
Contains all chat-related screens and messaging functionality.
- `ChatMessageScreen.jsx` - Main chat message screen (Screen 33)
- `ChatMessageScreen_BACKUP.jsx` - Backup of previous version
- `ChatsScreen.jsx` - Chats list screen (Screen 30)
- `ForwardMessageScreen.jsx` - Forward message functionality (Screen 36)
- `NewMessageScreen.jsx` - New message creation (Screen 31)
- `SearchChatScreen.jsx` - Search chats functionality (Screen 34)
- `UnlockChatScreen.jsx` - Unlock chat with PIN (Screen 35)

### 👥 **group/** - Group Chat Screens
Contains all group-related screens and group management.
- `ApproveMembersScreen.jsx` - Approve pending group members (Screen 38)
- `CreateGroupScreen.jsx` - Create new group (Screen 32)
- `EmptyGroupScreen.jsx` - Empty state for groups (Screen 37)
- `GroupChatScreen.jsx` - Group chat messaging (Screen 29)
- `GroupInfoScreen.jsx` - Group information and settings (Screen 29A)
- `GroupScreen.jsx` - Groups list screen (Screen 28)
- `JoinRequestPendingScreen.jsx` - Pending join requests

### 📞 **call/** - Call Screens
Contains all calling and voice/video call related screens.
- `CallsScreen.jsx` - Calls list screen (Screen 26)
- `IncomingCallScreen.jsx` - Incoming call notifications (Screen 27)
- `VideoCallScreen.jsx` - Video call interface (Screen 27B)
- `VoiceCallScreen.jsx` - Voice call interface (Screen 27A)

### ⚙️ **settings/** - Settings & Configuration Screens
Contains all settings, preferences, and configuration screens.
- `BiometricSetupScreen.jsx` - Biometric authentication setup (Screen 57)
- `ChangePasswordScreen.jsx` - Change master password (Screen 56)
- `EditNicknameScreen.jsx` - Edit user nickname (Screen 59)
- `MuteContactScreen.jsx` - Mute contact notifications (Screen 65)
- `NotificationsSettingsScreen.jsx` - Notification preferences (Screen 60)
- `PresenceVisibilityScreen.jsx` - Online presence visibility (Screen 61)
- `SecurityCenterScreen.jsx` - Security center (Screen 54)
- `SettingsScreen.jsx` - Main settings screen (Screen 55)
- `VerifySecurityScreen.jsx` - Security verification (Screen 64)

### 🗃️ **vault/** - Vault & Storage Screens
Contains screens related to file vault and encrypted storage.
- `VaultScreen.jsx` - Main vault screen (Screen 52)
- `VaultScreen_old.jsx` - Previous vault implementation
- `VaultEmptyScreen.jsx` - Empty vault state (Screen 51)
- `VaultFileExpiryModal.jsx` - File expiry notifications (Screen 53)

### 🔑 **common/** - Common/Shared Components & Screens
Contains shared utilities, common screens, and styling.
- `ContactInfoScreen.jsx` - Contact information display (Screen 63)
- `CIDFlowStyles.js` - Shared CSS/styling for CID flow
- `PinPad.jsx` - PIN input component (shared across screens)
- `ShareCIDScreen.jsx` - Share CID functionality (Screen 67)

### 🔲 **modals/** - Modal Components
Contains modal dialogs and overlay components.
- `AttachMediaModal.jsx` - Attach/upload media modal
- `AutoCloseModal.jsx` - Auto-close timer modal
- `DeletedMessageStatesModal.jsx` - Deleted message states (Screen 68)
- `LeaveGroupModel.jsx` - Leave group confirmation modal
- `RemovedByAdminModal.jsx` - Removed by admin notification

### 🆔 **CIDFlow/** - CID Identity Flow Screens
Contains screens for the CID (Cryptographic Identity) verification flow.
- `CIDFlowNavigator.jsx` - Navigation controller for CID flow
- `Screen42GeneratingCID.jsx` - CID generation process
- `Screen43CIDGenerated.jsx` - CID generated confirmation
- `Screen44MyIdentity.jsx` - My identity display
- `Screen45QRCode.jsx` - QR code share interface
- `Screen46Scanner.jsx` - QR code scanner
- `Screen47ContactFound.jsx` - Contact found after scan
- `Screen48AddByCID.jsx` - Add contact by CID
- `Screen49ContactAdded.jsx` - Contact successfully added

## Import Path Updates

All imports have been updated throughout the codebase to reflect the new folder structure:

### App.js Main Imports
```javascript
// Auth Screens
import WelcomeBackScreen from './screens/auth/WelcomeBackScreen';
import AccessDeniedScreen from './screens/auth/AccessDeniedScreen';

// Chat Screens
import ChatsScreen from './screens/chat/ChatsScreen';
import ChatMessageScreen from './screens/chat/ChatMessageScreen';

// Group Screens
import GroupScreen from './screens/group/GroupScreen';
import GroupChatScreen from './screens/group/GroupChatScreen';

// Call Screens
import CallsScreen from './screens/call/CallsScreen';
import VoiceCallScreen from './screens/call/VoiceCallScreen';

// Settings Screens
import SettingsScreen from './screens/settings/SettingsScreen';
import SecurityCenterScreen from './screens/settings/SecurityCenterScreen';

// Vault Screens
import VaultScreen from './screens/vault/VaultScreen';

// Common Screens
import ContactInfoScreen from './screens/common/ContactInfoScreen';
import PinPad from './screens/common/PinPad';

// Modals
import AttachMediaModal from './screens/modals/AttachMediaModal';
import DeletedMessageStatesModal from './screens/modals/DeletedMessageStatesModal';

// CID Flow
import CIDFlowNavigator from './screens/CIDFlow/CIDFlowNavigator';
```

### Within Screens
- **ChatMessageScreen** now imports modals:
  ```javascript
  import AttachMediaModal from '../modals/AttachMediaModal';
  import AutoCloseModal from '../modals/AutoCloseModal';
  ```

- **Auth screens** import PinPad:
  ```javascript
  import PinPad from '../common/PinPad';
  ```

- **CIDFlow screens** import styles:
  ```javascript
  import { CIDFlowStyles } from '../common/CIDFlowStyles';
  ```

## File Statistics

- **Total Screens**: 50 JSX files
- **Folders**: 8 organized categories + 1 CIDFlow directory
- **Modals**: 5 modal components
- **Common**: 4 shared files

## Scalability Benefits

1. **Clear Organization**: Files are grouped by functional domain
2. **Easier Navigation**: Developers can quickly find related screens
3. **Better Maintenance**: Changes to one feature don't affect unrelated code
4. **Import Clarity**: Import paths clearly indicate screen purpose
5. **Code Reusability**: Common components are centralized
6. **Future Growth**: Easy to add new screens to appropriate folders

## Adding New Screens

When adding new screens, follow the naming and organizational patterns:

1. **Create** the screen file with appropriate name
2. **Place** it in the correct folder based on functionality
3. **Update** relevant imports in navigation files
4. **Document** the screen's purpose in related README files
