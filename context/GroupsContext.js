import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
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
      
      // Cleanup media files aggressively to prevent disk full errors
      // Keeping only last 1 hour of decrypted media for current session
      messageStorage.pruneOldMedia(0.04).catch(e => console.error('[GroupsContext] Pruning failed:', e));
    };
    loadFromStorage();
  }, []);

  // ── Socket Events for Groups (REFINED) ──────────────────────────
  useEffect(() => {
    if (!socketConnected) return;

    // Listen for incoming group invites
    const unsubscribeInvite = socketService.on('groep:invite', (data) => {
      console.log('[GroupsContext] Received groep invite:', data.groupId);
      setGroupInvites(prev => {
        // Prevent duplicates
        if (prev.some(inv => inv.groupId === data.groupId)) return prev;
        return [...prev, data];
      });
    });

    // Listen for successful join
    const unsubscribeJoined = socketService.on('groep:joined', async (data) => {
      console.log('[GroupsContext] Successfully joined group:', data.groupName);
      // Backend already joined the room, we just need to ensure the group is in our list
      // and try to decrypt the key if it's there.
    });

    // Listen for group updates (new members, removed, etc.)
    const unsubscribeUpdate = socketService.on('group:update', async (data) => {
      console.log('[GroupsContext] Received group update:', data.type);
      
      if (data.type === 'member_added') {
        setGroups(prev => prev.map(g => 
          g.groupId === data.groupId 
            ? { ...g, members: [...(g.members || []), data.member] } 
            : g
        ));
      } else if (data.type === 'member_removed' || data.type === 'member_left') {
        if (data.memberCid === userCID) {
          // I was removed or left
          console.log(`[GroupsContext] Removing group data for: ${data.groupId}`);
          
          // Alert the user
          if (data.type === 'member_removed') {
            Alert.alert("Group Update", `You are no longer a member of ${data.groupName || 'this group'}.`);
          }

          // Delete all local messages for this group
          messageStorage.deleteAllMessages(data.groupId).catch(err => console.error("Failed to delete group messages:", err));

          setGroups(prev => prev.filter(g => g.groupId !== data.groupId));
        } else {
          setGroups(prev => {
            const updated = prev.map(g => 
              g.groupId === data.groupId 
                ? { ...g, members: (g.members || []).filter(m => m.cid !== data.memberCid), adminId: data.newAdminId || g.adminId } 
                : g
            );
            // Ensure uniqueness
            const uniqueMap = new Map();
            updated.forEach(g => uniqueMap.set(g.groupId, g));
            return Array.from(uniqueMap.values());
          });
        }
      }
    });

    // Listen for being explicitly removed from a group
    const unsubscribeRemoved = socketService.on('groep:removed', (data) => {
       console.log('[GroupsContext] You were removed from:', data.groupName);
       Alert.alert("Removed from Group", `The admin has removed you from ${data.groupName}.`);
       
       // Clean up local storage
       messageStorage.deleteAllMessages(data.groupId).catch(err => console.error("Failed to delete group messages:", err));
       
       setGroups(prev => prev.filter(g => g.groupId !== data.groupId));
    });

    // Handle generic groep:created confirmation for admin
    const unsubscribeCreated = socketService.on('groep:created', (data) => {
       console.log('[GroupsContext] Group creation confirmed:', data.groupId);
       setGroups(prev => prev.map(g => g.name === data.name ? { ...g, groupId: data.groupId, status: 'active' } : g));
    });

    // Listen for entire group being deleted (Admin left)
    const unsubscribeDeleted = socketService.on('groep:deleted', (data) => {
       console.log('[GroupsContext] Group was deleted by admin:', data.groupName);
       Alert.alert("Group Deleted", `The admin has left and deleted ${data.groupName}.`);
       
       // Clean up local storage
       messageStorage.deleteAllMessages(data.groupId).catch(e => {});
       
       setGroups(prev => prev.filter(g => g.groupId !== data.groupId));
    });

    // RECONCILIATION: Handle server-sent group list
    const unsubscribeList = socketService.on('groep:list', (serverGroups) => {
       console.log('[GroupsContext] Reconciling group list with server...');
       setGroups(prev => {
         // Keep only groups that are in the server list
         // OR groups that are currently "pending" (created but not yet confirmed by server)
         const reconciled = prev.filter(localGroup => {
           const isServerActive = serverGroups.some(sg => sg.groupId === localGroup.groupId);
           const isPending = localGroup.status === 'pending';
           
           if (!isServerActive && !isPending) {
              console.log(`[GroupsContext] Deleting removed group: ${localGroup.name}`);
              messageStorage.deleteAllMessages(localGroup.groupId).catch(e => {});
              return false;
           }
           return true;
         });
         
         // Add or update server groups
         serverGroups.forEach(sg => {
           const index = reconciled.findIndex(g => g.groupId === sg.groupId);
           if (index === -1) {
             reconciled.push({ ...sg, status: 'active' });
           } else {
             reconciled[index] = { ...reconciled[index], ...sg, status: 'active' };
           }
         });

         return reconciled;
       });
    });

    return () => {
      unsubscribeInvite();
      unsubscribeJoined();
      unsubscribeUpdate();
      unsubscribeCreated();
      unsubscribeRemoved();
      unsubscribeList();
      unsubscribeDeleted();
    };
  }, [socketConnected]);

  // AUTOMATIC KEY DECRYPTION EFFECT
  useEffect(() => {
    const decryptAll = async () => {
      for (const group of groups) {
        if (!group.groupKey && group.members?.some(m => m.cid === userCID && m.encryptedKey)) {
          console.log(`[GroupsContext] Auto-decrypting key for: ${group.name}`);
          await tryDecryptGroupKey(group);
        }
      }
    };
    decryptAll();
  }, [groups, userCID, tryDecryptGroupKey]);

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
   * Create a new group with standardized flow + E2EE key distribution
   */
  const createGroup = useCallback(async (groupData) => {
    if (!socketConnected) throw new Error("Connection lost");

    // 1. Generate Group Key (AES-256)
    const groupKeyRaw = generateRandomBytes(32);
    const groupKeyB64 = toBase64(groupKeyRaw);

    // 2. Encrypt Group Key for each member using their Public Key (E2EE Layer)
    const membersWithEncryptedKey = await Promise.all(groupData.members.map(async (m) => {
       let publicKey = m.publicKey;
       
       if (!publicKey) {
         try {
           const result = await socketService.searchContact(m.cid);
           if (result && result.otherUser && result.otherUser.publicKey) {
             publicKey = result.otherUser.publicKey;
           }
         } catch (err) {
           console.error(`[GroupsContext] Failed to fetch public key for ${m.nickname}:`, err);
         }
       }

       if (!publicKey) {
         console.warn(`[GroupsContext] Member ${m.nickname} missing public key!`);
         return { cid: m.cid, encryptedKey: null };
       }
       
       // Derive shared secret via ECDH
       const sharedSecret = await deriveSharedSecret(identityPrivKeyRef.current, publicKey);
       // Encrypt Group Key using Shared Secret
       const encryptedKey = await encryptAESGCM(sharedSecret, groupKeyB64);
       
       return {
         cid: m.cid,
         encryptedKey
       };
    }));

    const payload = {
      adminId: userCID,
      groupName: groupData.name,
      description: groupData.description,
      members: membersWithEncryptedKey // [{cid, encryptedKey}]
    };

    // Emit to server
    socketService.socket.emit("groep:create", payload);

    // Store locally (optimistically)
    const tempGroupId = 'pending-' + Date.now();
    const newGroup = {
       groupId: tempGroupId,
       name: groupData.name,
       description: groupData.description,
       adminId: userCID,
       members: [{ cid: userCID, nickname: userNickname, role: 'ADMIN' }],
       groupKey: groupKeyB64, // Admin knows the raw key
       status: 'creating'
    };
    setGroups(prev => [...prev, newGroup]);

    // Wait for server to confirm creation and give us the REAL UUID
    return new Promise((resolve, reject) => {
       const timer = setTimeout(() => {
         socketService.socket.off("groep:created", onCreated);
         resolve(newGroup); // Fallback to temp if timeout
       }, 5000);

       const onCreated = (data) => {
         if (data.name === groupData.name) {
           clearTimeout(timer);
           socketService.socket.off("groep:created", onCreated);
           const finalGroup = { ...newGroup, groupId: data.groupId, status: 'active' };
           setGroups(prev => prev.map(g => g.groupId === tempGroupId ? finalGroup : g));
           resolve(finalGroup);
         }
       };

       socketService.socket.on("groep:created", onCreated);
    });
  }, [socketConnected, userCID, userNickname, identityPrivKeyRef]);

  /**
   * Send Group Invite (Standardized + E2EE Key)
   */
  const sendGroupInvite = useCallback(async (groupId, memberCid, nickname, publicKey) => {
    if (!socketConnected) return;
    const group = groupsRef.current.find(g => g.groupId === groupId);
    if (!group) return;

    // Admin must have the groupKey to invite others
    if (!group.groupKey) {
       console.warn("[GroupsContext] Cannot invite: Group key missing locally");
       return;
    }

    try {
      // Derive shared secret and encrypt the group key for the new member
      const sharedSecret = await deriveSharedSecret(identityPrivKeyRef.current, publicKey);
      const encryptedKey = await encryptAESGCM(sharedSecret, group.groupKey);
      
      socketService.socket.emit("groep:invite:send", {
        groupId,
        adminCid: userCID,
        memberCid,
        encryptedKey
      });
      console.log(`[GroupsContext] Sent groep invite for ${nickname}`);
    } catch (err) {
      console.error("[GroupsContext] Failed to send invite:", err);
    }
  }, [socketConnected, userCID, identityPrivKeyRef]);

  /**
   * Accept Group Invite (Standardized + E2EE Key)
   */
  const acceptGroupInvite = useCallback(async (invite) => {
    if (!socketConnected) return;
    
    // Create the local group record
    const newGroup = {
      groupId: invite.groupId,
      name: invite.groupName,
      groupLogo: invite.groupLogo || null,
      adminId: invite.adminId || null,
      adminPublicKey: invite.adminPublicKey,
      members: [{ cid: userCID, nickname: userNickname, encryptedKey: invite.encryptedKey }],
      status: 'joined',
      createdAt: new Date().toISOString()
    };

    setGroups(prev => {
      // Prevent duplicates
      if (prev.some(g => g.groupId === newGroup.groupId)) return prev;
      return [...prev, newGroup];
    });

    socketService.socket.emit("groep:accept", {
      groupId: invite.groupId,
      userId: userCID
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
   * Remove Member (Admin Only)
   */
  const removeMember = useCallback((groupId, memberCid) => {
    if (!socketConnected) return;
    socketService.socket.emit("groep:remove_member", {
      groupId,
      adminCid: userCID,
      memberCid
    });
    // Optimistic update
    setGroups(prev => prev.map(g => 
      g.groupId === groupId 
        ? { ...g, members: g.members.filter(m => m.cid !== memberCid) } 
        : g
    ));
  }, [socketConnected, userCID]);

  /**
   * Leave Group
   */
  const leaveGroup = useCallback((groupId) => {
    if (!socketConnected) return;
    socketService.socket.emit("groep:leave", {
      groupId,
      userId: userCID
    });
    // Optimistic update
    setGroups(prev => prev.filter(g => g.groupId !== groupId));
  }, [socketConnected, userCID]);

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

    // Admin Public Key is required for decryption (ECDH)
    const adminPubKey = group.adminPublicKey || group.creatorPublicKey;

    if (!adminPubKey && (group.adminId || group.createdBy)) {
      const adminId = group.adminId || group.createdBy;
      console.log(`[GroupsContext] Missing adminPubKey for ${group.name}, fetching...`);
      try {
        const result = await socketService.searchContact(adminId);
        if (result && result.otherUser && result.otherUser.publicKey) {
          const fetchedPubKey = result.otherUser.publicKey;
          // Update local state
          setGroups(prev => prev.map(g => g.groupId === group.groupId ? { ...g, adminPublicKey: fetchedPubKey } : g));
          return await tryDecryptGroupKey({ ...group, adminPublicKey: fetchedPubKey });
        }
      } catch (err) {
        console.error(`[GroupsContext] Failed to fetch admin public key:`, err);
      }
    }

    if (!adminPubKey) {
      console.warn(`[GroupsContext] Decryption aborted: No public key for admin of ${group.name}`);
      return group.groupKey || null;
    }

    try {
      console.log(`[GroupsContext] Attempting to decrypt group key for: ${group.name}`);
      const sharedSecret = await deriveSharedSecret(identityPrivKeyRef.current, adminPubKey);
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
    removeMember,
    leaveGroup,
  };

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
};
