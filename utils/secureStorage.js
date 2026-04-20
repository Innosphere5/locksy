/**
 * secureStorage.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Implements the exact localStorage schema defined in the
 * CID Architecture System Design:
 *
 *  losky_cid_encrypted  →  Base64(salt:iv+ciphertext)
 *  losky_hash           →  SHA-256 integrity digest
 *  losky_nickname       →  AES-256-GCM encrypted nickname
 *  losky_cid_created    →  ISO 8601 timestamp
 *  losky_fail_count     →  Wrong-password attempt counter (1-3)
 *
 * 3 wrong passwords → nukeAllData() destroys everything.
 * No server. No database. All local. All encrypted.
 * ─────────────────────────────────────────────────────────────────
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Storage Key Constants (matches design schema) ──────────────────
export const STORAGE_KEYS = {
  CID_ENCRYPTED: 'losky_cid_encrypted',   // Base64(salt:iv+ciphertext)
  HASH:          'losky_hash',             // SHA-256 integrity digest
  NICKNAME:      'losky_nickname',         // AES-256-GCM encrypted
  CREATED:       'losky_cid_created',      // ISO 8601 timestamp
  FAIL_COUNT:    'losky_fail_count',       // Integer string 0-3
  CONTACTS:      'losky_contacts',         // JSON array of saved contacts
  BIOMETRIC_ENABLED: 'losky_biometric_enabled', // Boolean string
  BIOMETRIC_SECRET:  'losky_biometric_secret',  // Sensitive (Master Password)
};

// ── Bundle Operations ──────────────────────────────────────────────

/**
 * Persist the complete encrypted CID bundle to secure storage.
 * Called once during onboarding (password setup) and never again.
 *
 * @param {object} bundle
 * @param {string} bundle.encryptedCID      — `saltB64:encryptedB64`
 * @param {string} bundle.hash              — SHA-256 of plaintext CID
 * @param {string} [bundle.encryptedNickname] — encrypted nickname
 * @param {string} [bundle.timestamp]       — ISO 8601, defaults to now
 */
export const saveCIDBundle = async ({
  encryptedCID,
  hash,
  encryptedNickname = '',
  timestamp,
}) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.CID_ENCRYPTED, encryptedCID);
  await SecureStore.setItemAsync(STORAGE_KEYS.HASH,          hash);
  if (encryptedNickname) {
    await SecureStore.setItemAsync(STORAGE_KEYS.NICKNAME, encryptedNickname);
  }
  await SecureStore.setItemAsync(
    STORAGE_KEYS.CREATED,
    timestamp || new Date().toISOString()
  );
};

/**
 * Read all 4 schema fields from secure storage.
 *
 * @returns {{ encryptedCID, hash, nickname, created }}
 */
export const loadCIDBundle = async () => {
  const [encryptedCID, hash, nickname, created] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.CID_ENCRYPTED),
    SecureStore.getItemAsync(STORAGE_KEYS.HASH),
    SecureStore.getItemAsync(STORAGE_KEYS.NICKNAME),
    SecureStore.getItemAsync(STORAGE_KEYS.CREATED),
  ]);
  return { encryptedCID, hash, nickname, created };
};

/**
 * Check whether the onboarding CID bundle has been created.
 * Used by SplashScreen to decide: WelcomeBack vs Onboarding.
 *
 * @returns {boolean}
 */
export const hasCIDBundle = async () => {
  const val = await SecureStore.getItemAsync(STORAGE_KEYS.CID_ENCRYPTED);
  return !!val;
};

/**
 * Update only the encrypted nickname field.
 * Called when the user changes their nickname in Settings.
 *
 * @param {string} encryptedNickname — AES-256-GCM ciphertext
 */
export const saveEncryptedNickname = async (encryptedNickname) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.NICKNAME, encryptedNickname);
};

// ── Fail Counter ───────────────────────────────────────────────────

/**
 * Read the current wrong-password attempt count.
 * Returns 0 if never attempted.
 *
 * @returns {number}
 */
export const getFailCount = async () => {
  const val = await SecureStore.getItemAsync(STORAGE_KEYS.FAIL_COUNT);
  return val ? parseInt(val, 10) : 0;
};

/**
 * Increment the wrong-password attempt counter.
 * Returns the new count (1, 2, or 3).
 *
 * @returns {number} new count
 */
export const incrementFailCount = async () => {
  const current = await getFailCount();
  const next    = current + 1;
  await SecureStore.setItemAsync(STORAGE_KEYS.FAIL_COUNT, String(next));
  return next;
};

/**
 * Reset the fail counter after a successful login.
 */
export const resetFailCount = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.FAIL_COUNT);
};

// ── 3-Fail Nuke ───────────────────────────────────────────────────

/**
 * Destroy ALL Locksy data from secure storage.
 * Called automatically when wrong-password count reaches 3.
 *
 * Per design: "3 Wrong Passwords = ALL DATA DESTROYED — No recovery"
 *
 * Deletes: CID, hash, nickname, created timestamp, fail count.
 */
export const nukeAllData = async () => {
  const results = await Promise.allSettled(
    Object.values(STORAGE_KEYS).map(key =>
      SecureStore.deleteItemAsync(key)
    )
  );
  // Log any errors but don't throw — nuke must complete
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`[NUKE] Failed to delete key ${Object.values(STORAGE_KEYS)[i]}:`, r.reason);
    }
  });
};

// ── Biometric Persistence ──────────────────────────────────────────

/**
 * Check if biometric unlock is enabled in settings.
 *
 * @returns {Promise<boolean>}
 */
export const isBiometricEnabled = async () => {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
  return val === 'true';
};

/**
 * Enable or disable biometric unlock in settings.
 *
 * @param {boolean} enabled
 * @returns {Promise<void>}
 */
export const setBiometricEnabled = async (enabled) => {
  await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, String(enabled));
};

/**
 * Securely store the master password for biometric unlock.
 * Uses SecureStore with `requireAuthentication: true`.
 *
 * @param {string} password
 * @returns {Promise<void>}
 */
export const saveBiometricSecret = async (password) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_SECRET, password, {
    requireAuthentication: true,
  });
};

/**
 * Retrieve the master password for biometric unlock.
 * Triggers system biometric prompt.
 *
 * @returns {Promise<string|null>}
 */
export const getBiometricSecret = async () => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_SECRET, {
      requireAuthentication: true,
    });
  } catch (error) {
    console.warn('[secureStorage] Biometric auth failed or canceled:', error.message);
    return null;
  }
};

/**
 * Remove the master password from biometric storage.
 * @returns {Promise<void>}
 */
export const deleteBiometricSecret = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_SECRET);
};

// ── Contact Persistence (AsyncStorage) ──────────────────────────────
// Contacts are not security-critical (already synchronized with server)
// Using AsyncStorage for faster access and simpler API

/**
 * Load all saved contacts from persistent storage.
 *
 * @returns {array} Array of contact objects or empty array if none saved
 */
export const loadContacts = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[secureStorage] Error loading contacts:', error);
    return [];
  }
};

/**
 * Save the complete contacts array to persistent storage.
 * Overwrites existing contacts.
 *
 * @param {array} contacts — Array of contact objects
 * @returns {Promise<void>}
 */
export const saveContacts = async (contacts) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  } catch (error) {
    console.error('[secureStorage] Error saving contacts:', error);
  }
};

/**
 * Add a single contact to the saved contacts list.
 * Prevents duplicates by checking for existing CID.
 *
 * @param {object} contact — Contact object with cid, nickname, avatar, roomId, etc.
 * @returns {Promise<void>}
 */
export const addContact = async (contact) => {
  try {
    const existing = await loadContacts();
    
    // Check if contact already exists by CID
    if (existing.some(c => c.cid === contact.cid)) {
      console.warn(`[secureStorage] Contact ${contact.cid} already exists`);
      return;
    }
    
    // Add new contact with timestamp
    const updated = [
      ...existing,
      {
        ...contact,
        addedAt: new Date().toISOString(),
      }
    ];
    
    await saveContacts(updated);
  } catch (error) {
    console.error('[secureStorage] Error adding contact:', error);
  }
};

/**
 * Remove a contact by CID.
 *
 * @param {string} cid — Contact ID to remove
 * @returns {Promise<void>}
 */
export const removeContact = async (cid) => {
  try {
    const existing = await loadContacts();
    const updated = existing.filter(c => c.cid !== cid);
    await saveContacts(updated);
  } catch (error) {
    console.error('[secureStorage] Error removing contact:', error);
  }
};

/**
 * Find a contact by CID.
 *
 * @param {string} cid — Contact ID to find
 * @returns {Promise<object|null>}
 */
export const findContact = async (cid) => {
  try {
    const contacts = await loadContacts();
    return contacts.find(c => c.cid === cid) || null;
  } catch (error) {
    console.error('[secureStorage] Error finding contact:', error);
    return null;
  }
};
