// appConfig.js — FIXED VERSION

const SERVER_IP = "192.168.31.172"; // your PC IP
const SOCKET_PORT = 5000;
const API_PORT = 3000;

const DEV = true; // change later for production
const DOMAIN = "locksy.info";

const AppConfig = {
  // ── Socket Server ─────────────────────────────
  SOCKET: {
    URL: DEV ? `http://${SERVER_IP}:${SOCKET_PORT}` : `https://${DOMAIN}`,
    PATH: "/socket.io/",
  },

  // ── API Backend (Next.js) ─────────────────────
  API: {
    BASE_URL: DEV ? `http://${SERVER_IP}:${API_PORT}/api/` : `https://${DOMAIN}/api/`,
  },

  // ── Debug ─────────────────────────────────────
  DEBUG: {
    VERBOSE_LOGGING: DEV,
  },

  // ── Security ──────────────────────────────────
  SECURITY: {
    MAX_PASSWORD_ATTEMPTS: 3,
  },
};

export default AppConfig;