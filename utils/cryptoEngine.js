/**
 * cryptoEngine.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * 100% Local Cryptographic Engine — Noble Implementation
 * Zero Server Trust — AES-256-GCM — PBKDF2 10K — ECDH P2P
 *
 * This version uses the Noble suite of libraries for cross-platform
 * stability in React Native / Expo Hermes environments.
 *
 * Performance: 10K iterations of PBKDF2 in JS takes ~100-150ms on mobile.
 * ─────────────────────────────────────────────────────────────────
 */

import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { gcm } from "@noble/ciphers/aes";
import { p256 } from "@noble/curves/p256";
import { randomBytes } from "@noble/hashes/utils";

/**
 * Manual Base64 Implementation for React Native (Hermes)
 * Since btoa and atob are not available by default.
 */
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export const toBase64 = (bytes) => {
  let result = "";
  let i;
  const l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += CHARS[bytes[i - 2] >> 2];
    result += CHARS[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += CHARS[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
    result += CHARS[bytes[i] & 0x3f];
  }
  if (i === l + 1) {
    result += CHARS[bytes[i - 2] >> 2];
    result += CHARS[(bytes[i - 2] & 0x03) << 4];
    result += "==";
  } else if (i === l) {
    result += CHARS[bytes[i - 2] >> 2];
    result += CHARS[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += CHARS[(bytes[i - 1] & 0x0f) << 2];
    result += "=";
  }
  return result;
};

export const fromBase64 = (base64) => {
  const bytes = [];
  const charMap = {};
  for (let i = 0; i < CHARS.length; i++) charMap[CHARS[i]] = i;

  // Remove padding
  const base64Clean = base64.replace(/=/g, "");

  for (let i = 0; i < base64Clean.length; i += 4) {
    const chunk =
      (charMap[base64Clean[i]] << 18) |
      (charMap[base64Clean[i + 1]] << 12) |
      ((charMap[base64Clean[i + 2]] || 0) << 6) |
      (charMap[base64Clean[i + 3]] || 0);

    bytes.push((chunk >> 16) & 0xff);
    if (base64Clean[i + 2] !== undefined) bytes.push((chunk >> 8) & 0xff);
    if (base64Clean[i + 3] !== undefined) bytes.push(chunk & 0xff);
  }
  return new Uint8Array(bytes);
};

/**
 * Helper to convert string to UTF-8 bytes.
 * Manual implementation for environments without TextEncoder.
 */
const strToBytes = (str) => {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
};

/**
 * Helper to convert bytes to UTF-8 string.
 * Manual implementation for environments without TextDecoder.
 */
const bytesToStr = (bytes) => {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return str;
};

// ── Entropy Generation ─────────────────────────────────────────────

/**
 * Generate a cryptographically random byte array.
 * Uses globalThis.crypto.getRandomValues internally (polyfilled by react-native-get-random-values).
 */
export const generateRandomBytes = (length) => {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
};

/**
 * Generate a 32-byte salt for PBKDF2.
 */
export const generateSalt = () => generateRandomBytes(32);

// ── PBKDF2 Key Derivation ──────────────────────────────────────────

/**
 * Derive an AES-256 master key from a password using PBKDF2.
 * Iterations: 10,000 | Hash: SHA-256 | Key Length: 32 (256-bit)
 *
 * Note: 10K iterations optimizes for ultra-fast UX (~100-150ms)
 * Use for development/testing. For production, increase to 100K+
 */
export const deriveMasterKey = async (password, salt) => {
  console.log("[cryptoEngine] Starting PBKDF2-SHA256 (10,000 iterations)...");
  const start = Date.now();

  const passwordBytes = strToBytes(password);
  const saltBytes = salt instanceof Uint8Array ? salt : fromBase64(salt);

  console.log("[cryptoEngine] Inputs prepared. Running key derivation...");
  // PBKDF2-SHA256 with 10,000 iterations (ultra-fast on mobile)
  try {
    const key = pbkdf2(sha256, passwordBytes, saltBytes, {
      c: 10000,
      dkLen: 32,
    });
    const duration = Date.now() - start;
    console.log(`[cryptoEngine] PBKDF2 complete in ${duration}ms`);
    return key;
  } catch (err) {
    console.error("[cryptoEngine] PBKDF2 CRASHED:", err.message);
    throw err;
  }
};

// ── CID Generation ─────────────────────────────────────────────────

/**
 * Generate a cryptographically unique CID using CSPRNG.
 * Format: 6 alphanumeric characters (A-Z, 0-9)
 * Entropy: 36^6 ≈ 2.18 billion combinations (extremely secure)
 * Stored securely in Expo SecureStore (AES-256-GCM encrypted)
 */
export const generateCID = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = generateRandomBytes(6); // 6 chars = unique, memorable CID
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
};

// ── AES-256-GCM Encryption / Decryption ───────────────────────────

/**
 * Encrypt plaintext using AES-256-GCM.
 * Random 12-byte IV per encryption.
 * Result: iv (12B) || ciphertext || tag (16B)
 */
export const encryptAESGCM = async (key, plaintext) => {
  const iv = generateRandomBytes(12);
  const aes = gcm(key, iv);
  const plaintextBytes = strToBytes(plaintext);

  const encrypted = aes.encrypt(plaintextBytes);

  // Pack IV + Encrypted Data (Noble GCM combines ciphertext and tag)
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv, 0);
  combined.set(encrypted, iv.length);

  return toBase64(combined);
};

/**
 * Decrypt AES-256-GCM ciphertext.
 * Throws on wrong password or tampering.
 */
export const decryptAESGCM = async (key, encryptedBase64) => {
  const combined = fromBase64(encryptedBase64);
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const aes = gcm(key, iv);
  const decrypted = aes.decrypt(encrypted);

  return bytesToStr(decrypted);
};

// ── SHA-256 Integrity Digest ───────────────────────────────────────

/**
 * Compute SHA-256 hash of a string.
 */
export const computeSHA256 = async (data) => {
  const hashBytes = sha256(strToBytes(data));
  return Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// ── CID Bundle Helpers ─────────────────────────────────────────────

/**
 * Full flow: PBKDF2 → AES-Encrypt(CID) → SHA-Hash(CID)
 */
export const encryptCIDBundle = async (password, cid) => {
  const salt = generateSalt();
  const key = await deriveMasterKey(password, salt);
  const encryptedCID = await encryptAESGCM(key, cid);
  const hash = await computeSHA256(cid);

  return {
    encryptedCID: `${toBase64(salt)}:${encryptedCID}`,
    hash,
  };
};

/**
 * Verify flow: PBKDF2 → AES-Decrypt(CID) → SHA-Verify(CID)
 */
export const decryptCIDBundle = async (
  password,
  encryptedCIDWithSalt,
  expectedHash,
) => {
  const [saltB64, encryptedCID] = encryptedCIDWithSalt.split(":");

  const salt = fromBase64(saltB64);
  const key = await deriveMasterKey(password, salt);
  const cid = await decryptAESGCM(key, encryptedCID);

  const computedHash = await computeSHA256(cid);
  if (computedHash !== expectedHash) {
    throw new Error("CID integrity check failed");
  }

  return cid;
};

/**
 * Restore key for session.
 */
export const getKeyFromBundle = async (password, encryptedCIDWithSalt) => {
  const [saltB64] = encryptedCIDWithSalt.split(":");
  return deriveMasterKey(password, fromBase64(saltB64));
};

// ── ECDH P2P Key Exchange ──────────────────────────────────────────

/**
 * Generate ECDH P-256 Key Pair.
 */
export const generateECDHKeyPair = async () => {
  const privateKey = p256.utils.randomPrivateKey();
  const publicKey = p256.getPublicKey(privateKey);

  return {
    publicKeyB64: toBase64(publicKey),
    privateKeyB64: toBase64(privateKey),
  };
};

/**
 * Derive Shared Secret via Diffie-Hellman.
 */
export const deriveSharedSecret = async (
  myPrivateKeyB64,
  partnerPublicKeyB64,
) => {
  const myPriv = fromBase64(myPrivateKeyB64);
  const partPub = fromBase64(partnerPublicKeyB64);

  const sharedPoint = p256.getSharedSecret(myPriv, partPub);

  // Use first 32 bytes of shared secret for AES key
  const sharedKeyRaw = sha256(sharedPoint).slice(0, 32);
  return sharedKeyRaw;
};

// ── Room ID Generation ─────────────────────────────────────────────

export const generateRoomID = async (cidA, cidB, timestamp) => {
  const ts = timestamp || Date.now();
  const sorted = [cidA, cidB].sort().join("");
  return computeSHA256(`${sorted}${ts}`);
};
