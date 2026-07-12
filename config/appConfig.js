// appConfig.js — LOCAL/PRODUCTION CONFIG
import Constants from "expo-constants";

const getEnvValue = (key, fallback) => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const getExpoExtraValue = (key, fallback) => {
  const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
  return extra[key] || fallback;
};

const normalizeOrigin = (value, fallback) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return fallback;
  return trimmed.replace(/\/+$/, "");
};

const normalizeApiBaseUrl = (value, fallback) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  const base = trimmed || fallback;
  const withoutTrailingSlash = base.replace(/\/+$/, "");

  if (!withoutTrailingSlash) {
    return fallback;
  }

  if (/\/api(?:\/|$)/i.test(withoutTrailingSlash)) {
    return `${withoutTrailingSlash}/`;
  }

  return `${withoutTrailingSlash}/api/`;
};

const SERVER_IP = getEnvValue("EXPO_PUBLIC_SERVER_IP", "192.168.1.23");
const SOCKET_PORT = getEnvValue("EXPO_PUBLIC_SOCKET_PORT", "5050");
const API_PORT = getEnvValue("EXPO_PUBLIC_API_PORT", "5050");
const MEDIA_PORT = getEnvValue("EXPO_PUBLIC_MEDIA_PORT", "5050");

const DEV = __DEV__;
const SERVER_DOMAIN = getEnvValue(
  "EXPO_PUBLIC_SERVER_DOMAIN",
  "locksy-server.onrender.com",
);
const ADMIN_DOMAIN = getEnvValue("EXPO_PUBLIC_ADMIN_DOMAIN", "locksy.info");
const API_BASE_URL = normalizeApiBaseUrl(
  getEnvValue(
    "EXPO_PUBLIC_API_BASE_URL",
    DEV ? "" : getExpoExtraValue("apiUrl", ""),
  ),
  DEV ? `http://${SERVER_IP}:${API_PORT}` : `https://${ADMIN_DOMAIN}`,
);
const SOCKET_BASE_URL = normalizeOrigin(
  getEnvValue(
    "EXPO_PUBLIC_SOCKET_BASE_URL",
    DEV ? "" : getExpoExtraValue("socketUrl", ""),
  ),
  DEV ? `http://${SERVER_IP}:${SOCKET_PORT}` : `https://${SERVER_DOMAIN}`,
);
const MEDIA_BASE_URL = normalizeOrigin(
  getEnvValue(
    "EXPO_PUBLIC_MEDIA_BASE_URL",
    DEV ? "" : getExpoExtraValue("mediaUrl", ""),
  ),
  DEV ? `http://${SERVER_IP}:${MEDIA_PORT}` : `https://${SERVER_DOMAIN}`,
);

const AppConfig = {
  SOCKET: {
    URL: SOCKET_BASE_URL,
    PATH: "/socket.io/",
  },
  API: {
    BASE_URL: API_BASE_URL,
  },
  MEDIA: {
    BASE_URL: MEDIA_BASE_URL,
  },
  DEBUG: {
    VERBOSE_LOGGING: DEV,
  },
  SECURITY: {
    MAX_PASSWORD_ATTEMPTS: 3,
  },
};

export default AppConfig;
