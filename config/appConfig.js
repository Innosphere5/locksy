/**
 * appConfig.js — Locksy App Configuration
 * ─────────────────────────────────────────────────────────────────
 * Centralized configuration for server endpoints and app settings
 * Update the SERVER_URL to match your development environment
 * ─────────────────────────────────────────────────────────────────
 */

// ⚠️  CONFIGURE YOUR SERVER IP ADDRESS HERE ⚠️
const SERVER_IP = "192.168.31.172"; // Change to your PC's IP address
const SERVER_PORT = 5000;

const AppConfig = {
  // ── Socket.io Server Configuration ───────────────────────────────
  SERVER: {
    URL: `http://${SERVER_IP}:${SERVER_PORT}`,
    IP: SERVER_IP,
    PORT: SERVER_PORT,
    PROTOCOL: "http",
  },

  // ── Socket.io Configuration Options ──────────────────────────────
  SOCKET_OPTIONS: {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    autoConnect: true,
    forceNew: false,
    multiplex: true,
    path: "/socket.io/",
  },

  // ── Development Settings ────────────────────────────────────────
  DEBUG: {
    VERBOSE_LOGGING: true,
    SOCKET_DEBUG: true,
    CRYPTO_DEBUG: false,
  },

  // ── Timeout Settings ────────────────────────────────────────────
  TIMEOUTS: {
    SOCKET_CONNECTION: 10000, // ms
    REGISTRATION: 10000, // ms
    SEARCH: 10000, // ms
    MESSAGE_SEND: 5000, // ms
  },

  // ── Security Settings ──────────────────────────────────────────
  SECURITY: {
    // PBKDF2 iterations for key derivation
    PBKDF2_ITERATIONS: 10000,
    // AES-256-GCM algorithm
    ENCRYPTION_ALGORITHM: "AES-256-GCM",
    // Maximum failed password attempts before data wipe
    MAX_PASSWORD_ATTEMPTS: 3,
  },

  // ── Feature Flags ──────────────────────────────────────────────
  FEATURES: {
    ENABLE_MESSAGE_ENCRYPTION: true,
    ENABLE_VOICE_CALLS: true,
    ENABLE_VIDEO_CALLS: true,
    ENABLE_FILE_SHARING: true,
    ENABLE_GROUPS: true,
  },
};

export default AppConfig;
