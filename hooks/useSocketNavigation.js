/**
 * useSocketNavigation.js - Auto-navigate on socket events
 * 
 * Listen for incoming contact additions and auto-navigate to chat room
 * This ensures both users are redirected when a contact is added
 */

import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import socketService from '../utils/socketService';

export const useSocketNavigation = () => {
  const navigation = useNavigation();

  useEffect(() => {
    console.log("[useSocketNavigation] Setting up socket navigation listeners");

    // Listen for when another user adds YOU as a contact
    const handleContactAdded = (data) => {
      console.log("[useSocketNavigation] Contact added - auto-navigating to chat", data);
      
      if (data && data.roomId && data.newContact) {
        // Navigate to ChatMessage with the new contact info
        setTimeout(() => {
          navigation.replace('ChatMessage', {
            chatId: data.roomId,
            contactName: data.newContact.nickname,
            contactCID: data.newContact.cid,
            contactAvatar: data.newContact.avatar || '👤',
          });
        }, 500); // Small delay to ensure UI is ready
      }
    };

    // Register the listener
    socketService.onContactAdded(handleContactAdded);

    return () => {
      // Cleanup - remove listener when component unmounts
      if (socketService.socket) {
        socketService.socket.off('contact:added', handleContactAdded);
      }
    };
  }, [navigation]);
};

export default useSocketNavigation;
