/**
 * socketService.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Socket.io Client Service for real-time communication
 * Handles multiplexing, request protocol, and local persistence.
 * ─────────────────────────────────────────────────────────────────
 */

import { io } from "socket.io-client";
import AppConfig from "../config/appConfig";
import messageStorage from "./messageStorage";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userCid = null;
    this.userData = null; // Store { cid, nickname, avatar } for re-registration
    this.callbacks = new Map(); // eventName -> Set of callbacks
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Initialize Socket.io connection
   */
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      // If already connected, resolve immediately
      if (this.socket && this.isConnected) {
        resolve();
        return;
      }

      try {
        console.log(`[SocketService] Connecting to ${serverUrl}...`);

        this.socket = io(serverUrl, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          autoConnect: true,
          path: "/socket.io/",
        });

        // Connection established
        this.socket.on("connect", () => {
          console.log(`[SocketService] Connected with ID: ${this.socket.id}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // AUTOMATIC RE-REGISTRATION
          if (this.userData) {
            console.log(`[SocketService] Re-registering user: ${this.userData.cid}`);
            this.socket.emit("register", this.userData);
          }

          this._dispatch("socket:connected", { socketId: this.socket.id });
          resolve();
        });

        // Setup global listeners once (Multiplexing)
        this._setupSocketListeners();

        this.socket.on("connect_error", (error) => {
          console.error("[SocketService] Connection error:", error);
          this._dispatch("socket:error", { error });
          reject(error);
        });

        this.socket.on("disconnect", (reason) => {
          console.warn(`[SocketService] Disconnected: ${reason}`);
          this.isConnected = false;
          this._dispatch("socket:disconnected", { reason });
        });
      } catch (error) {
        console.error("[SocketService] Connection exception:", error);
        reject(error);
      }
    });
  }

  /**
   * Internal: Setup core socket events that should always be handled
   * This ensures we don't attach multiple listeners to the raw socket.
   */
  _setupSocketListeners() {
    if (!this.socket) return;

    // Remove existing if any (multiplexing fix)
    this.socket.removeAllListeners("message:received");
    this.socket.removeAllListeners("contact:request");
    this.socket.removeAllListeners("contact:accepted");
    this.socket.removeAllListeners("user:status");

    // Standard Message Listener
    this.socket.on("message:received", async (message) => {
      console.log("[SocketService] Global message:received triggered");
      
      // PERSIST IMMEDIATELY TO LOCAL STORAGE
      await messageStorage.saveMessage(message.roomId, message);
      
      // Dispatch to UI listeners
      this._dispatch("message:received", message);
    });

    // Connection Request Listener
    this.socket.on("contact:request", (data) => {
      console.log("[SocketService] Received contact:request from:", data.fromCid);
      this._dispatch("contact:request", data);
    });

    // Connection Accepted Listener
    this.socket.on("contact:accepted", (data) => {
      console.log("[SocketService] Connection accepted between:", data.userA, "and", data.userB);
      this._dispatch("contact:accepted", data);
    });

    // Status Listener
    this.socket.on("user:status", (data) => {
      this._dispatch("user:status", data);
    });

    // Join room status
    this.socket.on("room:joined", (data) => {
       this._dispatch("room:joined", data);
    });
  }

  /**
   * Multiplexing Dispatcher
   */
  _dispatch(eventName, data) {
    const callbacks = this.callbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[SocketService] Error in callback for ${eventName}:`, e);
        }
      });
    }
  }

  /**
   * Register internal callback (Multiplexing)
   */
  on(eventName, callback) {
    // Some events are mapped to socket events via _setupSocketListeners
    if (!this.callbacks.has(eventName)) {
      this.callbacks.set(eventName, new Set());
    }
    this.callbacks.get(eventName).add(callback);
    
    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Unregister callback
   */
  off(eventName, callback) {
    const callbacks = this.callbacks.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Convenience: Register listener for incoming messages
   */
  onMessageReceived(callback) {
    return this.on("message:received", callback);
  }

  /**
   * Convenience: Register listener for when a contact connection is established
   */
  onContactAdded(callback) {
    return this.on("contact:accepted", callback);
  }

  /**
   * Register user with CID
   */
  registerUser(cid, nickname, avatar = null) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not connected"));
      this.userCid = cid;

      console.log(`[SocketService] Registering user: ${cid}`);
      const regData = { cid, nickname, avatar };
      this.socket.emit("register", regData);

      const onRegisterSuccess = (data) => {
        this.userData = regData; // Save for automatic re-registration
        this.socket.off("register:success", onRegisterSuccess);
        this.socket.off("register:error", onRegisterError);
        resolve(data);
      };

      const onRegisterError = (err) => {
        this.socket.off("register:success", onRegisterSuccess);
        this.socket.off("register:error", onRegisterError);
        reject(new Error(err.message || "Registration failed"));
      };

      this.socket.on("register:success", onRegisterSuccess);
      this.socket.on("register:error", onRegisterError);

      setTimeout(() => {
        this.socket.off("register:success", onRegisterSuccess);
        this.socket.off("register:error", onRegisterError);
        reject(new Error("Registration timeout"));
      }, 15000);
    });
  }

  /**
   * Search for contact (Just discovery)
   */
  searchContact(otherCid) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not connected"));
      
      this.socket.emit("search:cid", { myCid: this.userCid, otherCid });

      const onSuccess = (data) => {
        this.socket.off("search:success", onSuccess);
        this.socket.off("search:error", onError);
        resolve(data);
      };

      const onError = (err) => {
        this.socket.off("search:success", onSuccess);
        this.socket.off("search:error", onError);
        reject(new Error(err.message || "Search failed"));
      };

      this.socket.on("search:success", onSuccess);
      this.socket.on("search:error", onError);

      setTimeout(() => {
        this.socket.off("search:success", onSuccess);
        this.socket.off("search:error", onError);
        reject(new Error("Search timeout"));
      }, 10000);
    });
  }

  /**
   * Send Connection Request
   */
  sendConnectionRequest(toCid) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not connected"));
      
      this.socket.emit("contact:request:send", { fromCid: this.userCid, toCid });

      const onSuccess = (data) => {
        this.socket.off("contact:request:success", onSuccess);
        this.socket.off("contact:request:error", onError);
        resolve(data);
      };

      const onError = (err) => {
        this.socket.off("contact:request:success", onSuccess);
        this.socket.off("contact:request:error", onError);
        reject(new Error(err.message || "Failed to send request"));
      };

      this.socket.on("contact:request:success", onSuccess);
      this.socket.on("contact:request:error", onError);
    });
  }

  /**
   * Accept Connection Request
   */
  acceptConnectionRequest(fromCid) {
    if (!this.socket) return;
    this.socket.emit("contact:request:accept", { fromCid, toCid: this.userCid });
  }

  /**
   * Direct Add QR Contact
   */
  addContactDirect(toCid) {
    if (!this.socket) return;
    this.socket.emit("contact:add_direct", { fromCid: this.userCid, toCid });
  }

  /**
   * Send message
   */
  sendMessage(roomId, message, senderNickname) {
    if (!this.socket || !this.userCid) return;

    this.socket.emit("message:send", {
      roomId,
      message,
      senderCid: this.userCid,
      senderNickname,
    });
  }

  /**
   * Fetch chat history (Sync)
   */
  getChatHistory(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not connected"));

      this.socket.emit("room:getHistory", { roomId });

      const onHistory = (data) => {
        this.socket.off("room:history", onHistory);
        this.socket.off("room:error", onError);
        resolve(data);
      };

      const onError = (err) => {
        this.socket.off("room:history", onHistory);
        this.socket.off("room:error", onError);
        reject(new Error(err.message || "Failed to fetch history"));
      };

      this.socket.on("room:history", onHistory);
      this.socket.on("room:error", onError);
    });
  }

  joinRoom(roomId) {
    if (!this.socket) return Promise.reject(new Error("Socket missing"));
    this.socket.emit("room:join", { roomId });
    return Promise.resolve();
  }

  waitForConnection(timeoutMs = 15000) {
    if (this.isConnected) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (this.isConnected) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error("Socket connection timeout"));
        }
      }, 500);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

const socketService = new SocketService();
export default socketService;
