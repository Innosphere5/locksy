/**
 * socketService.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Socket.io Client Service for real-time communication
 * Handles connection, user registration, contact search, messaging
 * Uses AppConfig for server URL configuration
 * ─────────────────────────────────────────────────────────────────
 */

import { io } from "socket.io-client";
import AppConfig from "../config/appConfig";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userCid = null;
    this.listeners = new Map(); // Event name -> [callback, callback, ...]
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize Socket.io connection
   * @param {string} serverUrl - Server URL from AppConfig (e.g., "http://192.168.31.1:5000")
   * Configure in: locksy/config/appConfig.js
   * @returns {Promise<void>}
   */
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[SocketService] Connecting to ${serverUrl}...`);

        this.socket = io(serverUrl, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          autoConnect: true,
          forceNew: false,
          multiplex: true,
          path: "/socket.io/",
        });

        // Connection established
        this.socket.on("connect", () => {
          console.log(`[SocketService] Connected with ID: ${this.socket.id}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this._emit("socket:connected", { socketId: this.socket.id });
          resolve();
        });

        // Connection error
        this.socket.on("connect_error", (error) => {
          console.error("[SocketService] Connection error:", error);
          this._emit("socket:error", { error });
          reject(error);
        });

        // Reconnection attempt
        this.socket.on("reconnect_attempt", () => {
          this.reconnectAttempts++;
          console.log(
            `[SocketService] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
          );
          this._emit("socket:reconnecting", {
            attempt: this.reconnectAttempts,
          });
        });

        // Disconnected
        this.socket.on("disconnect", (reason) => {
          console.warn(`[SocketService] Disconnected: ${reason}`);
          this.isConnected = false;
          this._emit("socket:disconnected", { reason });
        });
      } catch (error) {
        console.error("[SocketService] Connection failed:", error);
        reject(error);
      }
    });
  }

  /**
   * Register user with CID
   * @param {string} cid - User's Contact ID
   * @param {string} nickname - User's nickname
   * @param {string} avatar - User's avatar
   * @returns {Promise<{message: string, cid: string}>}
   */
  registerUser(cid, nickname, avatar = null) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.userCid = cid;

      console.log(`[SocketService] Registering user: ${cid}`);

      this.socket.emit("register", {
        cid,
        nickname,
        avatar,
      });

      // Wait for response
      const handleSuccess = (data) => {
        this.socket.off("register:success", handleSuccess);
        this.socket.off("register:error", handleError);
        console.log("[SocketService] Registration successful");
        resolve(data);
      };

      const handleError = (error) => {
        this.socket.off("register:success", handleSuccess);
        this.socket.off("register:error", handleError);
        console.error("[SocketService] Registration error:", error);
        reject(new Error(error.message || "Registration failed"));
      };

      this.socket.on("register:success", handleSuccess);
      this.socket.on("register:error", handleError);

      // Timeout after 10 seconds
      setTimeout(() => {
        this.socket.off("register:success", handleSuccess);
        this.socket.off("register:error", handleError);
        reject(new Error("Registration timeout"));
      }, 10000);
    });
  }

  /**
   * Search for contact by CID and create chat room
   * @param {string} otherCid - Other user's CID
   * @returns {Promise<{roomId: string, otherUser: object}>}
   */
  searchAndAddContact(otherCid) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.userCid) {
        reject(new Error("Socket not connected or user not registered"));
        return;
      }

      console.log(`[SocketService] Searching for contact: ${otherCid}`);

      this.socket.emit("search:cid", {
        myCid: this.userCid,
        otherCid,
      });

      const handleSuccess = (data) => {
        this.socket.off("search:success", handleSuccess);
        this.socket.off("search:error", handleError);
        console.log("[SocketService] Contact found:", data.otherUser.cid);
        resolve(data);
      };

      const handleError = (error) => {
        this.socket.off("search:success", handleSuccess);
        this.socket.off("search:error", handleError);
        console.error("[SocketService] Search error:", error);
        reject(new Error(error.message || "Contact not found"));
      };

      this.socket.on("search:success", handleSuccess);
      this.socket.on("search:error", handleError);

      // Timeout after 10 seconds
      setTimeout(() => {
        this.socket.off("search:success", handleSuccess);
        this.socket.off("search:error", handleError);
        reject(new Error("Search timeout"));
      }, 10000);
    });
  }

  /**
   * Send message to chat room
   * @param {string} roomId - Chat room ID
   * @param {string} message - Message content
   * @param {string} senderNickname - Sender's nickname
   * @returns {void}
   */
  sendMessage(roomId, message, senderNickname) {
    if (!this.socket) {
      console.error("[SocketService] Socket not connected - cannot send message");
      return;
    }

    if (!this.userCid) {
      console.error("[SocketService] User not registered - cannot send message");
      return;
    }

    console.log(
      `[SocketService] Emitting message:send to server - roomId: ${roomId}, from: ${this.userCid}`,
    );
    console.log(
      `[SocketService] Message content: "${message.substring(0, 80)}..."`,
    );

    this.socket.emit("message:send", {
      roomId,
      message,
      senderCid: this.userCid,
      senderNickname,
    });
    
    console.log("[SocketService] message:send emitted successfully");
  }

  /**
   * Listen for incoming messages
   * @param {Function} callback - Function to call when message received
   */
  onMessageReceived(callback) {
    if (!this.socket) {
      console.error("[SocketService] Cannot register message listener - socket not connected");
      return;
    }
    console.log("[SocketService] Registering listener for message:received event");
    this.socket.on("message:received", (message) => {
      console.log("[SocketService] Socket.io event 'message:received' triggered with:", message);
      callback(message);
    });
    this._addListener("message:received", callback);
  }

  /**
   * Wait for socket to be connected
   * @returns {Promise<void>}
   */
  waitForConnection(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        console.log("[SocketService] Socket already connected");
        resolve();
        return;
      }

      console.log("[SocketService] Waiting for socket connection...");
      
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.isConnected) {
          clearInterval(checkInterval);
          console.log("[SocketService] Socket is now connected");
          resolve();
        } else if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          reject(new Error("Socket connection timeout"));
        }
      }, 100);
    });
  }

  /**
   * Join a chat room (ensures socket is part of the room)
   * @param {string} roomId - Chat room ID
   * @returns {Promise<void>}
   */
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not created"));
        return;
      }

      if (!this.isConnected) {
        reject(new Error("Socket not connected"));
        return;
      }

      console.log(`[SocketService] Joining room: ${roomId}`);
      this.socket.emit("room:join", { roomId });

      const handleJoined = (data) => {
        console.log("[SocketService] Room join successful:", data);
        this.socket.off("room:joined", handleJoined);
        this.socket.off("room:error", handleError);
        clearTimeout(timeoutHandle);
        resolve(data);
      };

      const handleError = (error) => {
        console.error("[SocketService] Room join failed:", error);
        this.socket.off("room:joined", handleJoined);
        this.socket.off("room:error", handleError);
        clearTimeout(timeoutHandle);
        reject(new Error(error.message || "Failed to join room"));
      };

      this.socket.on("room:joined", handleJoined);
      this.socket.on("room:error", handleError);

      // Timeout after 10seconds
      const timeoutHandle = setTimeout(() => {
        this.socket.off("room:joined", handleJoined);
        this.socket.off("room:error", handleError);
        console.error("[SocketService] Room join timeout after 10s");
        reject(new Error("Room join timeout"));
      }, 10000);
    });
  }
  getChatHistory(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      console.log(`[SocketService] Fetching history for ${roomId}`);

      this.socket.emit("room:getHistory", { roomId });

      const handleHistory = (data) => {
        this.socket.off("room:history", handleHistory);
        this.socket.off("room:error", handleError);
        console.log(
          `[SocketService] Received ${data.messages.length} messages`,
        );
        resolve(data);
      };

      const handleError = (error) => {
        this.socket.off("room:history", handleHistory);
        this.socket.off("room:error", handleError);
        reject(new Error(error.message || "Failed to fetch history"));
      };

      this.socket.on("room:history", handleHistory);
      this.socket.on("room:error", handleError);

      setTimeout(() => {
        this.socket.off("room:history", handleHistory);
        this.socket.off("room:error", handleError);
        reject(new Error("History fetch timeout"));
      }, 10000);
    });
  }

  /**
   * Mark message as read
   * @param {string} roomId - Chat room ID
   * @param {string} messageId - Message ID
   */
  markMessageAsRead(roomId, messageId) {
    if (!this.socket) return;
    this.socket.emit("message:read", { roomId, messageId });
  }

  /**
   * Send typing indicator
   * @param {string} roomId - Chat room ID
   * @param {string} nickname - User's nickname
   */
  sendTypingIndicator(roomId, nickname) {
    if (!this.socket) return;
    this.socket.emit("typing:start", {
      roomId,
      userCid: this.userCid,
      nickname,
    });
  }

  /**
   * Stop typing indicator
   * @param {string} roomId - Chat room ID
   */
  stopTypingIndicator(roomId) {
    if (!this.socket) return;
    this.socket.emit("typing:stop", {
      roomId,
      userCid: this.userCid,
    });
  }

  /**
   * Listen for contact added notification
   * @param {Function} callback - Function to call when contact added
   */
  onContactAdded(callback) {
    if (!this.socket) return;
    this.socket.on("contact:added", callback);
    this._addListener("contact:added", callback);
  }

  /**
   * Listen for user status changes
   * @param {Function} callback - Function to call when status changes
   */
  onUserStatusChanged(callback) {
    if (!this.socket) return;
    this.socket.on("user:status", callback);
    this._addListener("user:status", callback);
  }

  /**
   * Listen for typing indicators
   * @param {Function} callback - Function to call when typing status changes
   */
  onTypingIndicator(callback) {
    if (!this.socket) return;
    this.socket.on("typing:active", (data) =>
      callback({ ...data, isTyping: true }),
    );
    this.socket.on("typing:inactive", (data) =>
      callback({ ...data, isTyping: false }),
    );
    this._addListener("typing:active", callback);
    this._addListener("typing:inactive", callback);
  }

  /**
   * Manually register event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    if (!this.socket) return;
    this.socket.on(eventName, callback);
    this._addListener(eventName, callback);
  }

  /**
   * Emit event with callback
   * @param {string} eventName - Event name in CIDContext
   * @param {any} data - Data to pass
   * @private
   */
  _emit(eventName, data) {
    if (!this.listeners.has(eventName)) return;
    const callbacks = this.listeners.get(eventName);
    callbacks.forEach((cb) => cb(data));
  }

  /**
   * Register internal listener
   * @private
   */
  _addListener(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      console.log("[SocketService] Disconnecting...");
      this.socket.disconnect();
      this.isConnected = false;
      this.userCid = null;
    }
  }

  /**
   * Reconnect socket
   * @returns {Promise<void>}
   */
  reconnect(serverUrl) {
    this.disconnect();
    return this.connect(serverUrl);
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
