import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { COLORS } from '../theme';
import socketService from '../utils/socketService';
import { useCIDContext } from './CIDContext';
import { 
  generateRandomBytes, 
  toBase64, 
  encryptAESGCM, 
  decryptAESGCM,
  deriveSharedSecret,
  fromBase64
} from '../utils/cryptoEngine';
import messageStorage from '../utils/messageStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GroupsContext = createContext();

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error('useGroups must be used within GroupsProvider');
  }
  return context;
};

export const GroupsProvider = ({ children }) => {
  const { userCID, userNickname, identityPubKey, identityPrivKeyRef, socketConnected } = useCIDContext();
  const [groups, setGroups] = useState([]);
  const [groupInvites, setGroupInvites] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const groupsRef = useRef([]);

  // Sync ref with state
  useEffect(() => {
    groupsRef.current = groups;
    // Persist groups
    if (groups.length > 0) {
      AsyncStorage.setItem('losky_groups', JSON.stringify(groups)).catch(err => console.error('[GroupsContext] Save failed:', err));
    }
  }, [groups]);

  // Persist invites
  useEffect(() => {
    if (groupInvites.length > 0) {
       AsyncStorage.setItem('losky_group_invites', JSON.stringify(groupInvites)).catch(err => console.error('[GroupsContext] Save invites failed:', err));
    }
  }, [groupInvites]);

  // Load from storage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const savedGroups = await AsyncStorage.getItem('losky_groups');
        if (savedGroups) setGroups(JSON.parse(savedGroups));
        
        const savedInvites = await AsyncStorage.getItem('losky_group_invites');
        if (savedInvites) setGroupInvites(JSON.parse(savedInvites));
      } catch (err) {
        console.error('[GroupsContext] Load failed:', err);
      }
    };
    loadFromStorage();
  }, []);

  // ── Socket Events for Groups ─────────────────────────────────────
  useEffect(() => {
    if (!socketConnected) return;

    const unsubscribeUpdate = socketService.on('group:update', async (data) => {
      console.log('[GroupsContext] Received group update:', data.type);
      
      if (data.type === 'created' || data.type === 'added_to_group') {
        const group = data.group;
        setGroups(prev => {
          if (prev.some(g => g.groupId === group.groupId)) return prev;
          return [...prev, group];
        });
        // Auto-join room and try decrypting key
        socketService.joinRoom(group.groupId);
        setTimeout(() => tryDecryptGroupKey(group), 500);
      } else if (data.type === 'member_added') {
        setGroups(prev => prev.map(g => 
          g.groupId === data.groupId 
            ? { ...g, members: [...g.members, data.member] } 
            : g
        ));
      } else if (data.type === 'member_removed') {
        setGroups(prev => prev.map(g => 
          g.groupId === data.groupId 
            ? { ...g, members: g.members.filter(m => m.cid !== data.memberCid) } 
            : g
        ));
      } else if (data.type === 'removed_from_group') {
        setGroups(prev => prev.filter(g => g.groupId !== data.groupId));
      } else if (data.type === 'admin_promoted') {
        setGroups(prev => prev.map(g => 
          g.groupId === data.groupId 
            ? { ...g, members: g.members.map(m => m.cid === data.memberCid ? { ...m, role: 'ADMIN' } : m) } 
            : g
        ));
      }
    });

    const unsubscribeMessage = socketService.on('message:received', async (message) => {
       if (message.groupId) {
         console.log('[GroupsContext] Received group message for:', message.groupId);
       }
    });

    const unsubscribeInvite = socketService.on('group:invite', (data) => {
      console.log('[GroupsContext] Received group invite:', data.groupName);
      setGroupInvites(prev => {
        if (prev.some(inv => inv.groupId === data.groupId)) return prev;
        return [...prev, data];
      });
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeMessage();
      unsubscribeInvite();
    };
  }, [socketConnected]);

  /**
   * Get group by ID
   */
  const getGroup = useCallback(
    (groupId) => {
      return groups.find((g) => g.groupId === groupId);
    },
    [groups]
  );

  /**
   * Create a new group with E2EE
   */
  const createGroup = useCallback(async (groupData) => {
    if (!socketConnected) throw new Error("Connection lost");

    // 1. Generate Group Key (AES-256)
    const groupKeyRaw = generateRandomBytes(32);
    const groupKeyB64 = toBase64(groupKeyRaw);

    // 2. Encrypt Group Key for each member using their Public Key
    const membersWithEncryptedKey = await Promise.all(groupData.members.map(async (m) => {
       let publicKey = m.publicKey;
       
       // TRY TO FETCH MISSING PUBLIC KEY FROM SERVER
       if (!publicKey) {
         console.log(`[GroupsContext] Member ${m.nickname} missing public key, fetching from server...`);
         try {
           const searchResult = await socketService.searchContact(m.cid);
           if (searchResult && searchResult.otherUser && searchResult.otherUser.publicKey) {
             publicKey = searchResult.otherUser.publicKey;
             console.log(`[GroupsContext] Successfully fetched public key for ${m.nickname}`);
           }
         } catch (err) {
           console.error(`[GroupsContext] Failed to fetch public key for ${m.nickname}:`, err);
         }
       }

       if (!publicKey) {
         console.warn(`[GroupsContext] Member ${m.nickname} missing public key! E2EE will fail for them.`);
         return { ...m, role: 'MEMBER', encryptedKey: null };
       }
       
       // Derive shared secret via ECDH (My Private + Their Public)
       const sharedSecret = await deriveSharedSecret(identityPrivKeyRef.current, publicKey);
       // Encrypt Group Key using Shared Secret
       const encryptedKey = await encryptAESGCM(sharedSecret, groupKeyB64);
       
       return {
         cid: m.cid,
         nickname: m.nickname,
         role: 'MEMBER',
         encryptedKey
       };
    }));

    // Add creator as Admin
    membersWithEncryptedKey.push({
      cid: userCID,
      nickname: userNickname,
      role: 'ADMIN',
      encryptedKey: null // Creator already knows the key
    });

    const finalGroupData = {
      name: groupData.name,
      description: groupData.description,
      creatorCid: userCID,
      creatorPublicKey: identityPubKey, // Store creator's public key for others to decrypt the group key
      members: membersWithEncryptedKey
    };

    // 3. Emit to server
    socketService.socket.emit("group:create", finalGroupData);

    // 4. Store locally
    const newGroupId = 'pending-' + Date.now();
    const newGroup = {
       ...finalGroupData,
       groupId: newGroupId,
       groupKey: groupKeyB64 // Store locally for immediate use
    };

    // Success listener (one-time)
    socketService.socket.once("group:create:success", (group) => {
       setGroups(prev => prev.map(g => g.groupId === newGroupId ? { ...group, groupKey: groupKeyB64 } : g));
       // Join the room for real-time messages
       socketService.joinRoom(group.groupId);
    });

    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  }, [socketConnected, userCID, userNickname, identityPrivKeyRef, identityPubKey]);

  /**
   * Send Group Invite
   */
  const sendGroupInvite = useCallback(async (groupId, memberCid, nickname, publicKey) => {
    if (!socketConnected) return;
    const group = groupsRef.current.find(g => g.groupId === groupId);
    if (!group || !group.groupKey) return;

    try {
      const sharedSecret = await deriveSharedSecret(identityPrivKeyRef.current, publicKey);
      const encryptedKey = await encryptAESGCM(sharedSecret, group.groupKey);
      
      socketService.socket.emit("group:invite", {
        groupId,
        adminCid: userCID,
        memberCid,
        nickname,
        encryptedKey
      });
    } catch (err) {
      console.error("[GroupsContext] Failed to send invite:", err);
    }
  }, [socketConnected, userCID, identityPrivKeyRef]);

  /**
   * Accept Group Invite
   */
  const acceptGroupInvite = useCallback(async (invite) => {
    if (!socketConnected) return;
    
    socketService.socket.emit("group:invite:accept", {
      groupId: invite.groupId,
      memberCid: userCID,
      nickname: userNickname,
      encryptedKey: invite.encryptedKey
    });

    // Optimistically remove invite
    setGroupInvites(prev => prev.filter(inv => inv.groupId !== invite.groupId));
  }, [socketConnected, userCID, userNickname]);

  /**
   * Reject Group Invite
   */
  const rejectGroupInvite = useCallback((groupId) => {
    setGroupInvites(prev => prev.filter(inv => inv.groupId !== groupId));
  }, []);

  /**
   * Helper to decrypt a group key if possible
   */
  const tryDecryptGroupKey = useCallback(async (group) => {
    // Check if we have an encrypted key for ourselves in the members list
    const me = group.members?.find(m => m.cid === userCID);
    
    // If we are the creator and don't have a key, we should have generated it. 
    // This case usually happens for non-creators who joined via invite.
    if (!me || !me.encryptedKey) {
      return group.groupKey || null;
    }

    if (!group.creatorPublicKey && group.createdBy) {
      console.log(`[GroupsContext] Missing creatorPublicKey for ${group.name}, fetching from server...`);
      try {
        const result = await socketService.searchContact(group.createdBy);
        if (result && result.otherUser && result.otherUser.publicKey) {
          group.creatorPublicKey = result.otherUser.publicKey;
          // Update local state to avoid repeat fetches
          setGroups(prev => prev.map(g => g.groupId === group.groupId ? { ...g, creatorPublicKey: group.creatorPublicKey } : g));
        }
      } catch (err) {
        console.error(`[GroupsContext] Failed to fetch creator public key:`, err);
      }
    }

    if (!group.creatorPublicKey) {
      console.warn(`[GroupsContext] Decryption aborted: No public key for creator of ${group.name}`);
      return group.groupKey || null;
    }

    try {
      console.log(`[GroupsContext] Attempting to decrypt group key for: ${group.name}`);
      const sharedSecret = await deriveSharedSecret(identityPrivKeyRef.current, group.creatorPublicKey);
      const decryptedKey = await decryptAESGCM(sharedSecret, me.encryptedKey);
      
      setGroups(prev => prev.map(g => g.groupId === group.groupId ? { ...g, groupKey: decryptedKey } : g));
      console.log('[GroupsContext] Group key successfully decrypted for:', group.groupId);
      return decryptedKey;
    } catch (e) {
      console.error('[GroupsContext] Group key decryption failed:', e);
      return group.groupKey || null;
    }
  }, [userCID, identityPrivKeyRef]);

  /**
   * Decrypt Group Message
   */
  const decryptGroupMessage = useCallback(async (groupId, encryptedPayload) => {
    const group = groupsRef.current.find(g => g.groupId === groupId);
    if (!group) return "[Group Not Found]";

    let groupKey = group.groupKey;

    // If we don't have the group key yet, try to decrypt it from the member list
    if (!groupKey) {
       groupKey = await tryDecryptGroupKey(group);
    }

    // RETRY LOGIC: If key still missing, wait briefly and try once more
    // This handles cases where the message arrives immediately after group creation/joining
    if (!groupKey) {
      await new Promise(r => setTimeout(r, 800));
      const refreshedGroup = groupsRef.current.find(g => g.groupId === groupId);
      groupKey = refreshedGroup?.groupKey;
    }

    if (!groupKey) {
      console.warn(`[GroupsContext] Decryption failed: No key for group ${groupId}`);
      return "[Key Missing]";
    }

    try {
      const decrypted = await decryptAESGCM(fromBase64(groupKey), encryptedPayload);
      try {
        // Try parsing as JSON (for media objects)
        return JSON.parse(decrypted);
      } catch (e) {
        // Return as string (for regular text)
        return decrypted;
      }
    } catch (e) {
      return "[Decryption Failed]";
    }
  }, [userCID, identityPrivKeyRef]);

  const value = {
    groups,
    groupInvites,
    selectedGroupId,
    setSelectedGroupId,
    createGroup,
    getGroup,
    decryptGroupMessage,
    sendGroupInvite,
    acceptGroupInvite,
    rejectGroupInvite,
  };

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
};
