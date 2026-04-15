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

// ── Storage Key Constants (matches design schema) ──────────────────
export const STORAGE_KEYS = {
  CID_ENCRYPTED: 'losky_cid_encrypted',   // Base64(salt:iv+ciphertext)
  HASH:          'losky_hash',             // SHA-256 integrity digest
  NICKNAME:      'losky_nickname',         // AES-256-GCM encrypted
  CREATED:       'losky_cid_created',      // ISO 8601 timestamp
  FAIL_COUNT:    'losky_fail_count',       // Integer string 0-3
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
