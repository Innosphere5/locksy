// appConfig.js — MULTI-DOMAIN PRODUCTION VERSION

const SERVER_IP = "192.168.31.172"; // your PC IP
const SOCKET_PORT = 5050;
const API_PORT = 3000;
const MEDIA_PORT = 5050;

const DEV = __DEV__; // Automatically true in local dev, false in release builds
const SERVER_DOMAIN = "locksy-server.onrender.com"; // Render Backend (Sockets, Media)
const ADMIN_DOMAIN = "locksy.info";                 // Vercel Frontend (Auth, API)

const AppConfig = {
  // ── Socket Server (Render) ─────────────────────
  SOCKET: {
    URL: DEV ? `http://${SERVER_IP}:${SOCKET_PORT}` : `https://${SERVER_DOMAIN}`,
    PATH: "/socket.io/",
  },

  // ── API Backend (Vercel) ───────────────────────
  API: {
    BASE_URL: DEV ? `http://${SERVER_IP}:${API_PORT}/api/` : `https://${ADMIN_DOMAIN}/api/`,
  },

  // ── Media Server (Render) ──────────────────────
  MEDIA: {
    BASE_URL: DEV ? `http://${SERVER_IP}:${MEDIA_PORT}` : `https://${SERVER_DOMAIN}`,
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