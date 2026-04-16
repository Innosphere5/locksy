/**
 * useSocketNavigation.js - Auto-navigate on socket events
 * 
 * Listen for incoming contact additions and auto-navigate to chat room
 * This ensures both users are redirected when a contact is added
 */

import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import socketService from '../utils/socketService';
import { useCIDContext } from '../context/CIDContext';

export const useSocketNavigation = () => {
  const navigation = useNavigation();
  const { userCID } = useCIDContext();

  useEffect(() => {
    console.log("[useSocketNavigation] Setting up socket navigation listeners");

    // Listen for when a connection is established (accepted)
    const handleContactAdded = (data) => {
      console.log("[useSocketNavigation] Connection accepted - auto-navigating", data);
      
      if (data && data.roomId) {
        // Find which user in the data is the 'other' one
        const otherUser = data.userA === userCID ? data.accepter : data.requester;
        
        if (!otherUser) return;

        // Navigate to ChatMessage with the new contact info
        setTimeout(() => {
          navigation.replace('ChatMessage', {
            chatId: data.roomId,
            contactName: otherUser.nickname,
            contactCID: otherUser.cid,
            contactAvatar: otherUser.avatar || '👤',
          });
        }, 500);
      }
    };

    // Register the listener
    socketService.onContactAdded(handleContactAdded);

    return () => {
      // Cleanup - the unsubscribe is handled return with on()
      // but we used convenience wrapper which returns unsubscribe func
      // however here we don't have it saved, so we'll just use .off
      socketService.off('contact:accepted', handleContactAdded);
    };
  }, [navigation]);
};

export default useSocketNavigation;
