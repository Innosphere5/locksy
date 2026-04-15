/**
 * chatRoom.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Chat room security utilities per CID Architecture design:
 *
 *  • Room ID generation — SHA-256(CID_A + CID_B + timestamp)
 *  • ECDH session key pair for P2P key exchange
 *  • Derive shared AES secret from ECDH (Diffie-Hellman)
 *  • Auto-Destruct timer definitions: 1m | 5m | 1h | 6h | 12h | 24h | 48h
 *  • Message expiry helpers
 * ─────────────────────────────────────────────────────────────────
 */
import {
  generateECDHKeyPair,
  deriveSharedSecret,
  generateRoomID as _generateRoomID,
  encryptAESGCM,
  decryptAESGCM,
} from './cryptoEngine';

// ── Auto-Destruct Timer Options ────────────────────────────────────
// Matches design spec: 1m | 5m | 1h | 6h | 12h | 24h | 48h

export const AUTO_DESTRUCT_OPTIONS = [
  { label: 'Off',      ms: null },
  { label: '1 min',   ms: 60 * 1000 },
  { label: '5 min',   ms: 5  * 60 * 1000 },
  { label: '1 hour',  ms: 60 * 60 * 1000 },
  { label: '6 hours', ms: 6  * 60 * 60 * 1000 },
  { label: '12 hours',ms: 12 * 60 * 60 * 1000 },
  { label: '24 hours',ms: 24 * 60 * 60 * 1000 },
  { label: '48 hours',ms: 48 * 60 * 60 * 1000 },
];

// ── Room ID ────────────────────────────────────────────────────────

/**
 * Generate a local room ID for a chat session.
 * Formula: SHA-256(sorted(CID_A, CID_B) + timestamp)
 * Both participants compute the same ID independently.
 *
 * @param {string} cidA
 * @param {string} cidB
 * @returns {Promise<string>} 64-char hex room ID
 */
export const generateRoomID = (cidA, cidB) => _generateRoomID(cidA, cidB, Date.now());

// ── ECDH P2P Session ───────────────────────────────────────────────

/**
 * Create an ephemeral ECDH key pair for one chat session.
 * The public key is shared via QR code or link.
 * The private key never leaves the device.
 *
 * @returns {Promise<{ publicKeyB64: string, privateKeyB64: string }>}
 */
export const createECDHSession = async () => {
  return generateECDHKeyPair();
};

/**
 * Derive the shared AES-256 session key from ECDH exchange.
 * Both users arrive at the exact same key using Diffie-Hellman.
 * This key encrypts all messages in the chat room.
 *
 * @param {string} myPrivateKeyB64     — own PKCS8 private key in Base64
 * @param {string} partnerPublicKeyB64 — partner's raw public key in Base64
 * @returns {Promise<CryptoKey>} AES-GCM shared secret
 */
export const createSharedKey = (myPrivateKeyB64, partnerPublicKeyB64) => {
  return deriveSharedSecret(myPrivateKeyB64, partnerPublicKeyB64);
};

// ── Message Encryption (using ECDH shared key) ─────────────────────

/**
 * Encrypt a message using the ECDH shared session key.
 *
 * @param {CryptoKey} sharedKey — derived ECDH session key
 * @param {string}    message   — plaintext message
 * @returns {Promise<string>} Base64 ciphertext
 */
export const encryptMessage = (sharedKey, message) => {
  return encryptAESGCM(sharedKey, message);
};

/**
 * Decrypt a message using the ECDH shared session key.
 *
 * @param {CryptoKey} sharedKey       — derived ECDH session key
 * @param {string}    encryptedBase64 — Base64 ciphertext
 * @returns {Promise<string>} decrypted plaintext
 */
export const decryptMessage = (sharedKey, encryptedBase64) => {
  return decryptAESGCM(sharedKey, encryptedBase64);
};

// ── Auto-Destruct Helpers ──────────────────────────────────────────

/**
 * Check whether a message with a given creation timestamp has expired.
 *
 * @param {number}      createdAt — Date.now() when message was sent
 * @param {number|null} timerMs   — auto-destruct duration in ms, null = never
 * @returns {boolean}
 */
export const isMessageExpired = (createdAt, timerMs) => {
  if (!timerMs) return false;
  return Date.now() - createdAt > timerMs;
};

/**
 * Calculate the remaining time before a message self-destructs.
 * Returns null if the message has no timer or has already expired.
 *
 * @param {number}      createdAt — timestamp in ms
 * @param {number|null} timerMs
 * @returns {number|null} remaining ms
 */
export const getRemainingTime = (createdAt, timerMs) => {
  if (!timerMs) return null;
  const remaining = timerMs - (Date.now() - createdAt);
  return remaining > 0 ? remaining : null;
};

/**
 * Filter out expired messages from an array.
 * Each message must have { createdAt: number, timerMs: number|null }.
 *
 * @param {Array} messages
 * @returns {Array} non-expired messages
 */
export const filterExpiredMessages = (messages) => {
  return messages.filter(msg => !isMessageExpired(msg.createdAt, msg.timerMs));
};
