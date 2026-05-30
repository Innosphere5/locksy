/**
 * CIDContext.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Global CID Identity Context — CID Architecture Implementation
 *
 * Key architectural properties:
 *  • Password is NEVER stored — only used to derive an in-RAM AES key
 *  • CID is stored AES-256-GCM encrypted (losky_cid_encrypted)
 *  • Nickname is stored AES-256-GCM encrypted (losky_nickname)
 *  • SHA-256 integrity hash verifies correct decryption (losky_hash)
 *  • 3 wrong passwords → nukeAllData() — no recovery
 *  • masterKey held in useRef — never persisted, zeroed on lock
 *  • Socket.io integrated for real-time contact management
 * ─────────────────────────────────────────────────────────────────
 */
import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  encryptCIDBundle,
  decryptCIDBundle,
  getKeyFromBundle,
  encryptAESGCM,
  decryptAESGCM,
  generateCID,
  generateECDHKeyPair,
} from "../utils/cryptoEngine";
import {
  saveCIDBundle,
  loadCIDBundle,
  hasCIDBundle,
  saveEncryptedNickname,
  getFailCount,
  incrementFailCount,
  resetFailCount,
  nukeAllData,
  loadContacts,
  saveContacts,
  addContact as saveContactToStorage,
  removeContact as removeContactFromStorage,
  saveIdentityKeys,
  loadIdentityKeys,
} from "../utils/secureStorage";
import socketService from "../utils/socketService";
import mediaService from "../src/services/mediaService";
import AppConfig from "../config/appConfig";

export const CIDContext = createContext();

export const CIDProvider = ({ children }) => {
  // ── Identity State ───────────────────────────────────────────────
  const [userCID, setUserCIDState] = useState(null);
  const [userNickname, setUserNicknameState] = useState("");
  const [userAvatar, setUserAvatarState] = useState(null);
  const [identityPubKey, setIdentityPubKey] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const identityPrivKeyRef = useRef(null); // Decrypted private key in RAM

  // ── Session State ────────────────────────────────────────────────
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [failCount, setFailCount] = useState(0);

  // ── Contact / CID Flow State ─────────────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); // Array of { fromCid, fromNickname, fromAvatar }
  const [currentContact, setCurrentContact] = useState(null);
  const [scannedCID, setScannedCID] = useState(null);
  const [enteredCID, setEnteredCID] = useState(["", "", "", "", "", ""]);

  // ── Socket.io State ──────────────────────────────────────────────
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const socketInitializedRef = useRef(false);

  // ── Master Key (in-memory ONLY — NEVER persisted) ────────────────
  // Cleared when the app locks or the user logs out.
  const masterKeyRef = useRef(null);

  // ── Init: load fail count ────────────────────────────────────────
  useEffect(() => {
    getFailCount().then(setFailCount).catch(console.error);
    
    // Load persisted avatar
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      AsyncStorage.getItem('losky_avatar').then(val => {
        if (val) setUserAvatarState(val);
      });
    });
  }, []);

  // ── Load saved contacts from storage ──────────────────────────────
  useEffect(() => {
    if (!isUnlocked) return;

    const loadSavedContacts = async () => {
      try {
        const savedContacts = await loadContacts();
        console.log('[CIDContext] Loaded contacts from storage:', savedContacts.length);
        
        // De-duplicate just in case storage has redundant entries
        const uniqueContacts = [];
        const seen = new Set();
        for (const c of savedContacts) {
           if (!seen.has(c.cid)) {
             seen.add(c.cid);
             uniqueContacts.push(c);
           }
        }
        setContacts(uniqueContacts);

        // AUTO-VERIFY: Refresh contacts missing public keys
        uniqueContacts.forEach(c => {
          if (!c.publicKey) {
            console.log(`[CIDContext] Contact ${c.nickname} missing public key, scheduling refresh...`);
            setTimeout(() => refreshContactPublicKey(c.cid), 2000);
          }
        });
      } catch (error) {
        console.error('[CIDContext] Error loading contacts:', error);
      }
    };

    loadSavedContacts();
  }, [isUnlocked]);

  // ── Socket.io Connection: Initialize when user is unlocked ───────
  useEffect(() => {
    if (!isUnlocked || !userCID) {
      return; 
    }

    const setupSocketListeners = () => {
      socketService.on("contact:request", (data) => {
        console.log("[CIDContext] Received contact request from:", data.fromNickname);
        if (data.publicKey) {
           setContacts(prev => prev.map(c => c.cid === data.fromCid ? { ...c, publicKey: data.publicKey } : c));
        }
        setPendingRequests(prev => {
          if (prev.some(r => r.fromCid === data.fromCid)) return prev;
          return [...prev, data];
        });
      });

      socketService.on("contact:accepted", (data) => {
        const otherUser = data.userA === userCID ? data.accepter : data.requester;
        const newContact = {
          cid: otherUser.cid,
          nickname: otherUser.nickname,
          avatar: otherUser.avatar,
          publicKey: otherUser.publicKey,
          status: "online",
          verified: true,
          addedAt: new Date().toISOString(),
          roomId: data.roomId,
        };
        addContact(newContact);
        setPendingRequests(prev => prev.filter(r => r.fromCid !== otherUser.cid));
      });

      socketService.on("user:status", (data) => {
        setContacts((prev) =>
          prev.map((contact) =>
            contact.cid === data.cid
              ? { 
                  ...contact, 
                  status: data.status, 
                  publicKey: data.publicKey || contact.publicKey,
                  nickname: data.nickname || contact.nickname,
                  avatar: data.avatar || contact.avatar
                }
              : contact,
          ),
        );
      });
    };

    const initializeSocket = async () => {
      try {
        if (!socketInitializedRef.current) {
          const serverUrl = AppConfig.SOCKET.URL;
          console.log("[CIDContext] Initializing Socket.io connection...");
          await socketService.connect(serverUrl);
          setSocketConnected(true);
          setSocketError(null);
          socketInitializedRef.current = true;
          setupSocketListeners();
        }

        let pubKey = identityPubKey;
        if (!pubKey) {
           const { publicKey } = await loadIdentityKeys();
           pubKey = publicKey;
        }
        await socketService.registerUser(userCID, userNickname, userAvatar, pubKey, pushToken);
        console.log("[CIDContext] User registration sync complete");
      } catch (error) {
        console.error("[CIDContext] Socket.io sync failed:", error);
        setSocketError(error.message || "Connection failed");
      }
    };

    initializeSocket();

    return () => {
      if (socketInitializedRef.current && !isUnlocked) {
        socketService.disconnect();
        setSocketConnected(false);
        socketInitializedRef.current = false;
      }
    };
  }, [isUnlocked, userCID, userNickname, userAvatar, identityPubKey, pushToken]);

  // ── Sync Push Token ──────────────────────────────────────────────
  useEffect(() => {
    if (socketConnected && pushToken && userCID) {
      console.log("[CIDContext] Syncing push token with server...");
      // Re-register to update the token on the server
      const syncToken = async () => {
        let pubKey = identityPubKey;
        if (!pubKey) {
           const { publicKey } = await loadIdentityKeys();
           pubKey = publicKey;
        }
        socketService.registerUser(userCID, userNickname, userAvatar, pubKey, pushToken)
          .catch(err => console.error("[CIDContext] Push token sync failed:", err));
      };
      syncToken();
    }
  }, [pushToken, socketConnected, userCID, userNickname, userAvatar, identityPubKey]);

  // ── Persist contacts to storage when they change ────────────────

  useEffect(() => {
    if (contacts.length > 0) {
      saveContacts(contacts).catch(err =>
        console.error('[CIDContext] Failed to save contacts:', err)
      );
    }
  }, [contacts]);

  // ────────────────────────────────────────────────────────────────
  // ONBOARDING: initializeCID
  // Called from SetupMasterPassword after a new password is set.
  // Generates a CSPRNG CID, derives PBKDF2 key, encrypts, stores.
  // Password is NEVER stored.
  // ────────────────────────────────────────────────────────────────

  /**
   * Full onboarding initialization:
   *   1. Generate CID via CSPRNG
   *   2. Derive AES-256 key via PBKDF2 (10K iterations)
   *   3. Encrypt CID with AES-256-GCM
   *   4. Compute SHA-256 integrity hash
   *   5. Encrypt nickname with same key
   *   6. Persist encrypted bundle — password never stored
   *
   * @param {string} password — new master password (never stored)
   * @param {string} [preGeneratedCID] — optional CID from Screen42 animation
   * @returns {string} the generated plaintext CID (held only in state)
   */
  const initializeCID = useCallback(
    async (password, preGeneratedCID) => {
      console.log("[CIDContext] initializeCID starting...");
      // Use pre-generated CID from animation if provided, else generate fresh
      const cid = preGeneratedCID || generateCID();
      console.log("[CIDContext] Using CID:", cid);

      try {
        // Encrypt CID + compute hash (PBKDF2 key derivation happens inside)
        console.log("[CIDContext] Attempting CID bundle encryption...");
        const { encryptedCID, hash } = await encryptCIDBundle(password, cid);
        console.log("[CIDContext] CID bundle encrypted successfully.");

        // Re-derive key for nickname encryption and to cache in RAM
        console.log("[CIDContext] Deriving session key...");
        const key = await getKeyFromBundle(password, encryptedCID);
        masterKeyRef.current = key;
        console.log("[CIDContext] Session key derived and cached.");

        // Encrypt nickname if already set
        let encryptedNickname = "";
        if (userNickname) {
          console.log("[CIDContext] Encrypting current nickname...");
          encryptedNickname = await encryptAESGCM(key, userNickname);
        }

        // ── Identity Key Generation ─────────────────────────────────
        console.log("[CIDContext] Generating persistent Identity Keys...");
        const { publicKeyB64, privateKeyB64 } = await generateECDHKeyPair();
        
        // Encrypt private key with session key before storage
        const encryptedPrivKey = await encryptAESGCM(key, privateKeyB64);
        await saveIdentityKeys(publicKeyB64, encryptedPrivKey);
        
        setIdentityPubKey(publicKeyB64);
        identityPrivKeyRef.current = privateKeyB64;
        console.log("[CIDContext] Identity Keys saved and cached.");

        // Persist encrypted bundle
        console.log("[CIDContext] Saving bundle to SecureStore...");
        await saveCIDBundle({
          encryptedCID,
          hash,
          encryptedNickname,
          timestamp: new Date().toISOString(),
        });
        console.log("[CIDContext] Bundle saved successfully.");

        // Reset fail counter on fresh setup
        await resetFailCount();

        // Update in-memory state
        setUserCIDState(cid);
        setIsUnlocked(true);
        setFailCount(0);

        console.log("[CIDContext] initializeCID complete, returning to UI...");
        return cid;
      } catch (err) {
        console.error("[CIDContext] initializeCID FATAL ERROR:", err);
        throw err;
      }
    },
    [userNickname],
  );

  // ────────────────────────────────────────────────────────────────
  // LOGIN: verifyAndUnlock
  // Decrypts stored CID with the provided password.
  // Returns: 'success' | 'wrong_password' | 'nuke'
  // ────────────────────────────────────────────────────────────────

  /**
   * Attempt to unlock the app with the given password:
   *   1. Load encrypted bundle from storage
   *   2. Decrypt CID using PBKDF2-derived key
   *   3. Verify SHA-256 integrity hash
   *   4. On success: cache key in RAM, set unlocked state
   *   5. On failure: increment counter; nuke on 3rd attempt
   *
   * @param {string} password
   * @returns {'success' | 'wrong_password' | 'nuke'}
   */
  const verifyAndUnlock = useCallback(async (password) => {
    try {
      const bundle = await loadCIDBundle();
      if (!bundle.encryptedCID) throw new Error("No CID bundle");

      // Throws if wrong password (AES-GCM auth tag) or tampered hash
      const cid = await decryptCIDBundle(
        password,
        bundle.encryptedCID,
        bundle.hash,
      );

      // Cache derived key in RAM for session use
      const key = await getKeyFromBundle(password, bundle.encryptedCID);
      masterKeyRef.current = key;

      // Decrypt nickname
      if (bundle.nickname) {
        try {
          const nickname = await decryptAESGCM(key, bundle.nickname);
          setUserNicknameState(nickname);
        } catch (_) {
          // Non-fatal — nickname decryption failure doesn't block login
        }
      }

      // Unlock
      setUserCIDState(cid);
      setIsUnlocked(true);
      await resetFailCount();
      setFailCount(0);

      // Load and decrypt Identity Keys
      const { publicKey, privateKey: encryptedPriv } = await loadIdentityKeys();
      if (publicKey && encryptedPriv) {
        try {
          const decryptedPriv = await decryptAESGCM(key, encryptedPriv);
          setIdentityPubKey(publicKey);
          identityPrivKeyRef.current = decryptedPriv;
          console.log("[CIDContext] Identity keys loaded and decrypted");
        } catch (e) {
          console.error("[CIDContext] Failed to decrypt identity keys:", e);
        }
      } else {
        // BACKWARD COMPATIBILITY: Generate keys if missing (older installations)
        console.log("[CIDContext] Identity keys missing, generating now...");
        const { publicKeyB64, privateKeyB64 } = await generateECDHKeyPair();
        const encPriv = await encryptAESGCM(key, privateKeyB64);
        await saveIdentityKeys(publicKeyB64, encPriv);
        setIdentityPubKey(publicKeyB64);
        identityPrivKeyRef.current = privateKeyB64;
        console.log("[CIDContext] Identity keys generated and saved.");
      }

      return "success";
    } catch (error) {
      // Wrong password OR tampered data — both lead to fail count increment
      console.warn("[CIDContext] verifyAndUnlock failed:", error.message);

      const newCount = await incrementFailCount();
      setFailCount(newCount);

      if (newCount >= 3) {
        // 3 Wrong Passwords = ALL DATA DESTROYED — no recovery
        await nukeAllData();
        masterKeyRef.current = null;
        setUserCIDState(null);
        setUserNicknameState("");
        setUserAvatarState(null);
        setIdentityPubKey(null);
        identityPrivKeyRef.current = null;
        setIsUnlocked(false);
        setFailCount(0);
        return "nuke";
      }

      return "wrong_password";
    }
  }, []);

  // ────────────────────────────────────────────────────────────────
  // CID Flow Support: setUserCID
  // Used by Screen42 to store an in-memory CID during the animation.
  // Does NOT persist to storage (that happens in SetupMasterPassword).
  // ────────────────────────────────────────────────────────────────
  const setUserCID = useCallback((cid) => {
    setUserCIDState(cid);
  }, []);

  // ────────────────────────────────────────────────────────────────
  // LOCK: clear session key from RAM & disconnect Socket.io
  // ────────────────────────────────────────────────────────────────
  const lock = useCallback(() => {
    masterKeyRef.current = null;
    setUserCIDState(null);
    setUserNicknameState("");
    setIdentityPubKey(null);
    identityPrivKeyRef.current = null;
    setIsUnlocked(false);

    // Disconnect Socket.io
    socketService.disconnect();
    setSocketConnected(false);
    socketInitializedRef.current = false;
  }, []);

  // ────────────────────────────────────────────────────────────────
  // Profile Updates
  // ────────────────────────────────────────────────────────────────

  /**
   * Update nickname — encrypts with master key before persisting.
   * Falls back to plaintext update if key not in RAM (shouldn't happen).
   */
  const updateNickname = useCallback(async (name) => {
    setUserNicknameState(name);
    if (masterKeyRef.current) {
      try {
        const encrypted = await encryptAESGCM(masterKeyRef.current, name);
        await saveEncryptedNickname(encrypted);
        
        // SYNC WITH SERVER
        if (socketConnected && userCID) {
          socketService.registerUser(userCID, name, userAvatar, identityPubKey, pushToken)
            .catch(err => console.error("[CIDContext] Profile sync failed:", err));
        }
      } catch (e) {
        console.error("[CIDContext] Failed to encrypt and save nickname:", e);
      }
    }
  }, [socketConnected, userCID, userAvatar, identityPubKey, pushToken]);

  /**
   * Update avatar URI (non-sensitive — stored as URI reference only).
   */
  const updateAvatar = useCallback(async (imgUri) => {
    let finalUri = imgUri;

    // 1. If it's a local file, convert it to a base64 data URL so it can be shared without S3
    if (imgUri && (imgUri.startsWith('file://') || imgUri.startsWith('content://'))) {
      if (!userCID) {
        console.error("[CIDContext] Cannot process avatar: userCID is missing");
        return;
      }
      try {
        console.log("[CIDContext] Converting local avatar to base64 for user:", userCID);
        // Fetch the file and convert to base64
        const res = await fetch(imgUri);
        const blob = await res.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const mime = blob.type || 'image/jpeg';
        finalUri = `data:${mime};base64,${base64}`;
        console.log("[CIDContext] Avatar converted to data URL, length:", finalUri.length);
      } catch (convErr) {
        console.error("[CIDContext] Failed to convert avatar to base64:", convErr);
        // Fallback: keep original local URI (will not be visible to others)
      }
    }

    setUserAvatarState(finalUri);
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem('losky_avatar', finalUri);
      console.log("[CIDContext] Avatar persisted:", finalUri);

      // SYNC WITH SERVER
      if (socketConnected && userCID) {
        socketService.registerUser(userCID, userNickname, finalUri, identityPubKey, pushToken)
          .catch(err => console.error("[CIDContext] Avatar sync failed:", err));
      }
    } catch (e) {
      console.error("[CIDContext] Failed to persist avatar:", e);
    }
  }, [socketConnected, userCID, userNickname, identityPubKey, pushToken]);

  // ────────────────────────────────────────────────────────────────
  // Contact Management with Socket.io
  // ────────────────────────────────────────────────────────────────
  const addContact = useCallback((contact) => {
    const newContact = {
      ...contact,
      id: contact.cid, // Use CID as unique identifier
      addedAt: new Date().toISOString(),
      verified: contact.verified || false,
    };

    setContacts((prev) => {
      if (prev.some(c => c.cid === newContact.cid)) {
        console.warn("[CIDContext] Contact already exists, skipping state add:", newContact.cid);
        return prev;
      }
      return [...prev, newContact];
    });

    // Save to permanent storage
    saveContactToStorage(newContact).catch(err => 
       console.error("[CIDContext] Storage sync failed:", err)
    );

    console.log("[CIDContext] Contact added:", newContact);
    return newContact;
  }, []);

  const removeContact = useCallback(async (cid) => {
    console.log("[CIDContext] Removing contact:", cid);
    
    // 1. Update state
    setContacts(prev => prev.filter(c => c.cid !== cid));
    
    // 2. Update storage
    await removeContactFromStorage(cid);

    // 3. Optional: Notify server or leave room
    const contact = contacts.find(c => c.cid === cid);
    if (contact && contact.roomId) {
      socketService.leaveRoom(contact.roomId);
    }
  }, [contacts]);

  /**
   * Force refresh of a contact's public key from the server
   */
  const refreshContactPublicKey = useCallback(async (cid) => {
    if (!socketConnected) return;
    try {
      console.log(`[CIDContext] Refreshing public key for: ${cid}`);
      const result = await socketService.searchContact(cid);
      if (result && result.otherUser && result.otherUser.publicKey) {
        setContacts(prev => prev.map(c => 
          c.cid === cid ? { ...c, publicKey: result.otherUser.publicKey } : c
        ));
        console.log(`[CIDContext] Public key updated for ${cid}`);
      }
    } catch (err) {
      console.error(`[CIDContext] Failed to refresh public key for ${cid}:`, err);
    }
  }, [socketConnected]);

  /**
   * Discovery search (does not create room)
   */
  const searchContactByCID = useCallback(
    (otherCid) => {
      if (!socketConnected) {
        return Promise.reject(new Error("Socket not connected"));
      }
      return socketService.searchContact(otherCid);
    },
    [socketConnected],
  );

  /**
   * Discovery search by Nickname
   */
  const searchContactByNickname = useCallback(
    (nickname) => {
      if (!socketConnected) {
        return Promise.reject(new Error("Socket not connected"));
      }
      return socketService.searchContactByNickname(nickname);
    },
    [socketConnected],
  );

  /**
   * Send connection request
   */
  const sendRequest = useCallback((toCid) => {
    return socketService.sendConnectionRequest(toCid);
  }, []);

  /**
   * Accept connection request
   */
  const acceptRequest = useCallback((fromCid) => {
    socketService.acceptConnectionRequest(fromCid);
    // Remove from local pending state
    setPendingRequests(prev => prev.filter(r => r.fromCid !== fromCid));
  }, []);

  /**
   * Send message to contact via Socket.io
   * @param {string} roomId - Chat room ID
   * @param {string} message - Message text
   */
  const sendMessage = useCallback(
    (roomId, message) => {
      if (!socketConnected) {
        console.error("[CIDContext] Socket not connected");
        return;
      }
      socketService.sendMessage(roomId, message, userNickname);
    },
    [socketConnected, userNickname],
  );

  /**
   * Get chat history for a room
   * @param {string} roomId - Chat room ID
   * @returns {Promise}
   */
  const getChatHistory = useCallback(
    (roomId) => {
      if (!socketConnected) {
        return Promise.reject(new Error("Socket not connected"));
      }
      return socketService.getChatHistory(roomId);
    },
    [socketConnected],
  );

  /**
   * Listen for incoming messages
   * @param {Function} callback - Callback function
   */
  const onMessageReceived = useCallback((callback) => {
    socketService.onMessageReceived(callback);
  }, []);

  const resetCIDFlow = useCallback(() => {
    setScannedCID(null);
    setEnteredCID(["", "", "", "", "", ""]);
    setCurrentContact(null);
  }, []);

  // ────────────────────────────────────────────────────────────────
  // Context Value
  // ────────────────────────────────────────────────────────────────
  const value = {
    // Identity
    userCID,
    setUserCID, // in-memory only during CID flow animation
    userNickname,
    updateNickname,
    userAvatar,
    updateAvatar,

    // Session
    isUnlocked,
    failCount,
    masterKeyRef, // Ref — use sparingly; never expose raw key in UI

    // Auth actions
    initializeCID, // onboarding: generate + encrypt + store
    verifyAndUnlock, // login: PBKDF2 decrypt + integrity check
    lock, // clear session key from RAM & disconnect Socket.io

    contacts,
    pendingRequests,
    acceptRequest,
    sendRequest,
    addContact,
    removeContact,
    currentContact,
    setCurrentContact,
    scannedCID,
    setScannedCID,
    enteredCID,
    setEnteredCID,
    resetCIDFlow,

    // Socket.io / Real-time Communication
    socketConnected,
    socketError,
    searchContactByCID,
    searchContactByNickname,
    sendMessage,
    getChatHistory,
    onMessageReceived,

    // Push Notifications
    setPushToken,
    pushToken,

    // Identity Keys (for secure key exchange)

    identityPubKey,
    identityPrivKeyRef,
    refreshContactPublicKey,
  };

  return <CIDContext.Provider value={value}>{children}</CIDContext.Provider>;
};

export const useCIDContext = () => {
  const context = React.useContext(CIDContext);
  if (!context) {
    throw new Error("useCIDContext must be used within CIDProvider");
  }
  return context;
};
