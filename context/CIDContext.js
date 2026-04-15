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
 * ─────────────────────────────────────────────────────────────────
 */
import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  encryptCIDBundle,
  decryptCIDBundle,
  getKeyFromBundle,
  encryptAESGCM,
  decryptAESGCM,
  generateCID,
} from '../utils/cryptoEngine';
import {
  saveCIDBundle,
  loadCIDBundle,
  hasCIDBundle,
  saveEncryptedNickname,
  getFailCount,
  incrementFailCount,
  resetFailCount,
  nukeAllData,
} from '../utils/secureStorage';

export const CIDContext = createContext();

export const CIDProvider = ({ children }) => {
  // ── Identity State ───────────────────────────────────────────────
  const [userCID,          setUserCIDState]      = useState(null);
  const [userNickname,     setUserNicknameState] = useState('');
  const [userAvatar,       setUserAvatarState]   = useState(null);

  // ── Session State ────────────────────────────────────────────────
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [failCount,  setFailCount]  = useState(0);

  // ── Contact / CID Flow State ─────────────────────────────────────
  const [contacts,        setContacts]       = useState([]);
  const [currentContact,  setCurrentContact] = useState(null);
  const [scannedCID,      setScannedCID]     = useState(null);
  const [enteredCID,      setEnteredCID]     = useState(['', '', '', '', '', '']);

  // ── Master Key (in-memory ONLY — NEVER persisted) ────────────────
  // Cleared when the app locks or the user logs out.
  const masterKeyRef = useRef(null);

  // ── Init: load fail count ────────────────────────────────────────
  useEffect(() => {
    getFailCount().then(setFailCount).catch(console.error);
  }, []);

  // ────────────────────────────────────────────────────────────────
  // ONBOARDING: initializeCID
  // Called from SetupMasterPassword after a new password is set.
  // Generates a CSPRNG CID, derives PBKDF2 key, encrypts, stores.
  // Password is NEVER stored.
  // ────────────────────────────────────────────────────────────────

  /**
   * Full onboarding initialization:
   *   1. Generate CID via CSPRNG
   *   2. Derive AES-256 key via PBKDF2 (600K iterations)
   *   3. Encrypt CID with AES-256-GCM
   *   4. Compute SHA-256 integrity hash
   *   5. Encrypt nickname with same key
   *   6. Persist encrypted bundle — password never stored
   *
   * @param {string} password — new master password (never stored)
   * @param {string} [preGeneratedCID] — optional CID from Screen42 animation
   * @returns {string} the generated plaintext CID (held only in state)
   */
  const initializeCID = useCallback(async (password, preGeneratedCID) => {
    console.log('[CIDContext] initializeCID starting...');
    // Use pre-generated CID from animation if provided, else generate fresh
    const cid = preGeneratedCID || generateCID();
    console.log('[CIDContext] Using CID:', cid);

    try {
      // Encrypt CID + compute hash (PBKDF2 key derivation happens inside)
      console.log('[CIDContext] Attempting CID bundle encryption...');
      const { encryptedCID, hash } = await encryptCIDBundle(password, cid);
      console.log('[CIDContext] CID bundle encrypted successfully.');

      // Re-derive key for nickname encryption and to cache in RAM
      console.log('[CIDContext] Deriving session key...');
      const key = await getKeyFromBundle(password, encryptedCID);
      masterKeyRef.current = key;
      console.log('[CIDContext] Session key derived and cached.');

      // Encrypt nickname if already set
      let encryptedNickname = '';
      if (userNickname) {
        console.log('[CIDContext] Encrypting current nickname...');
        encryptedNickname = await encryptAESGCM(key, userNickname);
      }

      // Persist encrypted bundle
      console.log('[CIDContext] Saving bundle to SecureStore...');
      await saveCIDBundle({
        encryptedCID,
        hash,
        encryptedNickname,
        timestamp: new Date().toISOString(),
      });
      console.log('[CIDContext] Bundle saved successfully.');

      // Reset fail counter on fresh setup
      await resetFailCount();

      // Update in-memory state
      setUserCIDState(cid);
      setIsUnlocked(true);
      setFailCount(0);

      console.log('[CIDContext] initializeCID complete, returning to UI...');
      return cid;
    } catch (err) {
      console.error('[CIDContext] initializeCID FATAL ERROR:', err);
      throw err;
    }
  }, [userNickname]);

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
      if (!bundle.encryptedCID) throw new Error('No CID bundle');

      // Throws if wrong password (AES-GCM auth tag) or tampered hash
      const cid = await decryptCIDBundle(
        password,
        bundle.encryptedCID,
        bundle.hash
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

      return 'success';

    } catch (error) {
      // Wrong password OR tampered data — both lead to fail count increment
      console.warn('[CIDContext] verifyAndUnlock failed:', error.message);

      const newCount = await incrementFailCount();
      setFailCount(newCount);

      if (newCount >= 3) {
        // 3 Wrong Passwords = ALL DATA DESTROYED — no recovery
        await nukeAllData();
        masterKeyRef.current = null;
        setUserCIDState(null);
        setUserNicknameState('');
        setUserAvatarState(null);
        setIsUnlocked(false);
        setFailCount(0);
        return 'nuke';
      }

      return 'wrong_password';
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
  // LOCK: clear session key from RAM
  // ────────────────────────────────────────────────────────────────
  const lock = useCallback(() => {
    masterKeyRef.current = null;
    setUserCIDState(null);
    setUserNicknameState('');
    setIsUnlocked(false);
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
      } catch (e) {
        console.error('[CIDContext] Failed to encrypt and save nickname:', e);
      }
    }
  }, []);

  /**
   * Update avatar URI (non-sensitive — stored as URI reference only).
   */
  const updateAvatar = useCallback((imgUri) => {
    setUserAvatarState(imgUri);
  }, []);

  // ────────────────────────────────────────────────────────────────
  // Contact Management
  // ────────────────────────────────────────────────────────────────
  const addContact = useCallback((contact) => {
    setContacts(prev => [...prev, contact]);
  }, []);

  const resetCIDFlow = useCallback(() => {
    setScannedCID(null);
    setEnteredCID(['', '', '', '', '', '']);
    setCurrentContact(null);
  }, []);

  // ────────────────────────────────────────────────────────────────
  // Context Value
  // ────────────────────────────────────────────────────────────────
  const value = {
    // Identity
    userCID,
    setUserCID,         // in-memory only during CID flow animation
    userNickname,
    updateNickname,
    userAvatar,
    updateAvatar,

    // Session
    isUnlocked,
    failCount,
    masterKeyRef,       // Ref — use sparingly; never expose raw key in UI

    // Auth actions
    initializeCID,      // onboarding: generate + encrypt + store
    verifyAndUnlock,    // login: PBKDF2 decrypt + integrity check
    lock,               // clear session key from RAM

    // Contacts / CID Flow
    contacts,
    addContact,
    currentContact,
    setCurrentContact,
    scannedCID,
    setScannedCID,
    enteredCID,
    setEnteredCID,
    resetCIDFlow,
  };

  return <CIDContext.Provider value={value}>{children}</CIDContext.Provider>;
};

export const useCIDContext = () => {
  const context = React.useContext(CIDContext);
  if (!context) {
    throw new Error('useCIDContext must be used within CIDProvider');
  }
  return context;
};
