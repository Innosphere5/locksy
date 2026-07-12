/**
 * socketService.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Socket.io Client Service for real-time communication
 * Handles multiplexing, request protocol, and local persistence.
 * ─────────────────────────────────────────────────────────────────
 */

import { io } from "socket.io-client";
import { AppState } from "react-native";
import AppConfig from "../config/appConfig";
import messageStorage from "./messageStorage";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userCid = null;
    this.userData = null; // Store { cid, nickname, avatar, publicKey } for re-registration
    this.callbacks = new Map(); // eventName -> Set of callbacks
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.serverUrl = null;

    // Listen for AppState changes to handle foregrounding
    if (typeof AppState !== "undefined") {
      AppState.addEventListener("change", (nextAppState) => {
        if (nextAppState === "active") {
          console.log("[SocketService] App came to foreground. Checking socket state...");
          if (this.socket && !this.isConnected) {
            console.log("[SocketService] Socket is not connected on foreground. Forcing reconnect...");
            this.socket.connect();
          }
        }
      });
    }
  }

  /**
   * Set user CID for the service
   */
  setUserCid(cid) {
    this.userCid = cid;
  }

  /**
   * Initialize Socket.io connection
   */
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      // If already connected, resolve immediately
      if (this.socket && this.isConnected) {
        if (this.serverUrl && this.serverUrl !== serverUrl) {
          console.log("[SocketService] Server URL changed, closing old socket...");
          this.socket.disconnect();
          this.socket.removeAllListeners();
          this.socket = null;
          this.isConnected = false;
        } else {
          resolve();
          return;
        }
      }

      this.serverUrl = serverUrl;

      // If socket exists but is disconnected, reuse it!
      if (this.socket) {
        console.log("[SocketService] Re-using existing socket, forcing connection...");
        
        const onConnect = () => {
          this.socket.off("connect", onConnect);
          this.socket.off("connect_error", onConnectError);
          resolve();
        };

        const onConnectError = (error) => {
          this.socket.off("connect", onConnect);
          this.socket.off("connect_error", onConnectError);
          reject(error);
        };

        this.socket.on("connect", onConnect);
        this.socket.on("connect_error", onConnectError);
        
        this.socket.connect();
        return;
      }

      try {
        console.log(`[SocketService] Connecting to ${serverUrl}...`);

        this.socket = io(serverUrl, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity, // Keep reconnecting forever
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
    this.socket.removeAllListeners("message:deleted");
    this.socket.removeAllListeners("message:reaction:updated");
    this.socket.removeAllListeners("contact:request");
    this.socket.removeAllListeners("contact:accepted");
    this.socket.removeAllListeners("user:status");
    this.socket.removeAllListeners("groep:invite");
    this.socket.removeAllListeners("groep:removed");
    this.socket.removeAllListeners("groep:created");
    this.socket.removeAllListeners("groep:deleted");
    this.socket.removeAllListeners("group:update");
    this.socket.removeAllListeners("room:joined");
    this.socket.removeAllListeners("call:offer");
    this.socket.removeAllListeners("call:answer");
    this.socket.removeAllListeners("call:ice-candidate");
    this.socket.removeAllListeners("call:rejected");
    this.socket.removeAllListeners("call:ended");
    this.socket.removeAllListeners("call:busy");
    this.socket.removeAllListeners("call:ringing");
    this.socket.removeAllListeners("message:status:update");
    this.socket.removeAllListeners("message:sent");
    this.socket.removeAllListeners("room:timer:updated");

    // Standard Message Listener
    this.socket.on("message:received", async (message) => {
      console.log("[SocketService] Global message:received triggered");
      
      // PERSIST IMMEDIATELY TO LOCAL STORAGE
      await messageStorage.saveMessage(message.roomId || message.groupId, message);
      
      // Dispatch to UI listeners
      this._dispatch("message:received", message);
    });

    // Message Deleted Listener
    this.socket.on("message:deleted", async (data) => {
      console.log("[SocketService] Global message:deleted triggered", data.messageId);
      
      // REMOVE FROM LOCAL STORAGE IMMEDIATELY
      await messageStorage.deleteMessage(data.roomId, data.messageId);
      
      // Dispatch to UI listeners
      this._dispatch("message:deleted", data);
    });

    // Message Bulk Deleted Listener
    this.socket.on("message:deleted_bulk", async (data) => {
      console.log(`[SocketService] Global message:deleted_bulk triggered for ${data.messageIds.length} msgs`);
      
      // REMOVE FROM LOCAL STORAGE IMMEDIATELY
      await messageStorage.deleteMessagesBulk(data.roomId, data.messageIds);
      
      // Dispatch to UI listeners
      this._dispatch("message:deleted_bulk", data);
    });

    // Message Reaction Listener
    this.socket.on("message:reaction:updated", async (data) => {
      console.log("[SocketService] Global message:reaction:updated triggered", data.messageId);
      
      // PERSIST REACTION LOCALLY
      await messageStorage.updateMessageReactions(data.roomId, data.messageId, data.emoji, data.action);
      
      // Dispatch to UI listeners
      this._dispatch("message:reaction:updated", data);
    });

    // Message Opened Listener (View Once)
    this.socket.on("message:opened", async (data) => {
      console.log("[SocketService] Global message:opened triggered", data.messageId);
      
      // PERSIST STATE LOCALLY (Scrubs media data)
      await messageStorage.markMessageAsOpened(data.roomId, data.messageId);
      
      // Dispatch to UI listeners
      this._dispatch("message:opened", data);
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

    // Group Invitation Listener (REFINED)
    this.socket.on("groep:invite", (data) => {
      console.log("[SocketService] Received groep:invite", data.groupName);
      this._dispatch("groep:invite", data);
    });

    // Group Update Listener
    this.socket.on("group:update", (data) => {
      console.log("[SocketService] Received group:update", data.type);
      this._dispatch("group:update", data);
    });

    // Group removed status
    this.socket.on("groep:removed", (data) => {
       console.log("[SocketService] Received groep:removed", data.groupId);
       this._dispatch("groep:removed", data);
    });

    // Group created status (for admin)
    this.socket.on("groep:created", (data) => {
       console.log("[SocketService] Received groep:created", data.groupId);
       this._dispatch("groep:created", data);
    });

    // Group deleted status (Admin left)
    this.socket.on("groep:deleted", (data) => {
       console.log("[SocketService] Received groep:deleted", data.groupId);
       this._dispatch("groep:deleted", data);
    });

    // Join room status
    this.socket.on("room:joined", (data) => {
       this._dispatch("room:joined", data);
    });

    // Call Signaling Listeners
    this.socket.on("call:offer", (data) => {
      console.log("[SocketService] Received call:offer", data.callId);
      this._dispatch("call:offer", data);
    });

    this.socket.on("call:answer", (data) => {
      console.log("[SocketService] Received call:answer", data.callId);
      this._dispatch("call:answer", data);
    });

    this.socket.on("call:ice-candidate", (data) => {
      this._dispatch("call:ice-candidate", data);
    });

    this.socket.on("call:rejected", (data) => {
      console.log("[SocketService] Received call:rejected", data.callId);
      this._dispatch("call:rejected", data);
    });

    this.socket.on("call:ended", (data) => {
      console.log("[SocketService] Received call:ended", data.callId);
      this._dispatch("call:ended", data);
    });

    this.socket.on("call:busy", (data) => {
      console.log("[SocketService] Received call:busy", data.callId);
      this._dispatch("call:busy", data);
    });

    this.socket.on("call:ringing", (data) => {
      console.log("[SocketService] Received call:ringing", data.callId);
      this._dispatch("call:ringing", data);
    });

    // Message Status Update Listener
    this.socket.on("message:status:update", async (data) => {
      console.log("[SocketService] Global message:status:update triggered", data.messageId, data.status);
      
      // PERSIST STATUS LOCALLY
      await messageStorage.updateMessageStatus(data.roomId || data.groupId, data.messageId, data.status);
      
      this._dispatch("message:status:update", data);
    });

    // Message Sent (Ack) Listener
    this.socket.on("message:sent", (data) => {
      console.log("[SocketService] Message sent (ack) received", data.id);
      this._dispatch("message:sent", data);
    });

    // Room Timer Listener
    this.socket.on("room:timer:updated", async (data) => {
      console.log("[SocketService] Global room:timer:updated triggered", data.roomId, data.timerMs);
      await messageStorage.saveChatTimer(data.roomId, data.timerMs);
      this._dispatch("room:timer:updated", data);
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
   * Convenience: Register listener for deleted messages
   */
  onMessageDeleted(callback) {
    return this.on("message:deleted", callback);
  }

  /**
   * Convenience: Register listener for updated message reactions
   */
  onMessageReactionUpdated(callback) {
    return this.on("message:reaction:updated", callback);
  }

  /**
   * Convenience: Register listener for opened view-once messages
   */
  onMessageOpened(callback) {
    return this.on("message:opened", callback);
  }

  /**
   * Convenience: Register listener for message status updates (Delivered/Read)
   */
  onMessageStatusUpdate(callback) {
    return this.on("message:status:update", callback);
  }

  /**
   * Convenience: Register listener for message sent acknowledgment
   */
  onMessageSent(callback) {
    return this.on("message:sent", callback);
  }

  /**
   * Convenience: Register listener for when a contact connection is established
   */
  onContactAdded(callback) {
    return this.on("contact:accepted", callback);
  }

  /**
   * Register user with CID and Public Key
   */
  async registerUser(cid, nickname, avatar = null, publicKey = null, pushToken = null) {
    try {
      if (!this.socket) {
        await this.connect(AppConfig.SOCKET.URL);
      }
      if (!this.isConnected) {
        await this.waitForConnection();
      }

      return new Promise((resolve, reject) => {
        this.userCid = cid;

        console.log(`[SocketService] Registering user: ${cid}`);
        const regData = { cid, nickname, avatar, publicKey, pushToken };
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
    } catch (err) {
      console.error("[SocketService] registerUser failed:", err);
      throw err;
    }
  }

  /**
   * Search for contact by CID (Just discovery)
   */
  async searchContact(otherCid) {
    try {
      // 1. Ensure we have a socket. If not, try to init with default URL
      if (!this.socket) {
        console.log("[SocketService] Socket missing during search, initializing...");
        await this.connect(AppConfig.SOCKET.URL);
      }

      // 2. Wait for connection if in progress
      if (!this.isConnected) {
        console.log("[SocketService] Waiting for connection before search...");
        await this.waitForConnection();
      }

      return new Promise((resolve, reject) => {
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
    } catch (err) {
      console.error("[SocketService] searchContact failed:", err);
      throw err;
    }
  }

  /**
   * Search for contact by Nickname
   */
  async searchContactByNickname(nickname) {
    try {
      // 1. Ensure we have a socket
      if (!this.socket) {
        console.log("[SocketService] Socket missing during nickname search, initializing...");
        await this.connect(AppConfig.SOCKET.URL);
      }

      // 2. Wait for connection
      if (!this.isConnected) {
        console.log("[SocketService] Waiting for connection before nickname search...");
        await this.waitForConnection();
      }

      return new Promise((resolve, reject) => {
        this.socket.emit("search:nickname", { nickname });

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
    } catch (err) {
      console.error("[SocketService] searchContactByNickname failed:", err);
      throw err;
    }
  }

  /**
   * Send Connection Request
   */
  async sendConnectionRequest(toCid) {
    try {
      if (!this.socket) {
        await this.connect(AppConfig.SOCKET.URL);
      }
      if (!this.isConnected) {
        await this.waitForConnection();
      }

      return new Promise((resolve, reject) => {
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
    } catch (err) {
      console.error("[SocketService] sendConnectionRequest failed:", err);
      throw err;
    }
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
   * WebRTC Call Signaling Methods
   */
  emitCallOffer(receiverId, callerName, callType, callId, offerSDP) {
    if (!this.socket) return;
    this.socket.emit("call:offer", { 
      receiverId, 
      callerName, 
      callType, 
      callId, 
      offerSDP,
      callerId: this.userCid
    });
  }

  emitCallRinging(callId, callerId) {
    if (!this.socket) return;
    this.socket.emit("call:ringing", { callId, callerId });
  }

  emitCallAnswer(callId, callerId, answerSDP) {
    if (!this.socket) return;
    this.socket.emit("call:answer", { callId, callerId, answerSDP });
  }

  emitIceCandidate(callId, receiverId, candidate) {
    if (!this.socket) return;
    this.socket.emit("call:ice-candidate", { callId, receiverId, candidate });
  }

  emitCallReject(callId, callerId, reason = 'rejected') {
    if (!this.socket) return;
    this.socket.emit("call:reject", { callId, callerId, reason });
  }

  emitCallEnd(callId, otherId) {
    if (!this.socket) return;
    this.socket.emit("call:end", { callId, otherId });
  }

  emitCallBusy(callId, callerId) {
    if (!this.socket) return;
    this.socket.emit("call:busy", { callId, callerId });
  }

  /**
   * Send message
   */
  sendMessage(roomId, message, senderNickname, senderAvatar) {
    if (!this.socket || !this.userCid) return;

    // message can be a string or an object { type, text, uri, etc }
    this.socket.emit("message:send", {
      id: (typeof message === 'object') ? message.id : null,
      roomId,
      message,
      senderCid: this.userCid,
      senderNickname,
      senderAvatar,
    });
  }

  /**
   * Emit Message Delivered Status
   */
  emitMessageDelivered(roomId, groupId, messageId) {
    if (!this.socket) return;
    this.socket.emit("message:delivered", { 
      roomId, 
      groupId, 
      messageId, 
      receiverCid: this.userCid 
    });
  }

  /**
   * Emit Message Read Status
   */
  emitMessageRead(roomId, groupId, messageId) {
    if (!this.socket) return;
    this.socket.emit("message:read", { 
      roomId, 
      groupId, 
      messageId, 
      receiverCid: this.userCid 
    });
  }

  /**
   * Delete message
   */
  deleteMessage(roomId, messageId) {
    if (!this.socket) return;
    this.socket.emit("message:delete", { roomId, messageId });
  }

  /**
   * Delete multiple messages (Bulk)
   */
  deleteMessagesBulk(roomId, messageIds) {
    if (!this.socket || !messageIds || messageIds.length === 0) return;
    this.socket.emit("message:delete_bulk", { roomId, messageIds });
  }

  /**
   * Toggle Reaction on a message
   */
  toggleReaction(roomId, messageId, emoji, action) {
    if (!this.socket) return;
    this.socket.emit("message:react", { roomId, messageId, emoji, action });
  }

  /**
   * Notify that a view-once message was opened
   */
  messageOpened(roomId, messageId) {
    if (!this.socket) return;
    this.socket.emit("message:opened", { roomId, messageId });
  }

  /**
   * Fetch chat history (Sync)
   */
  async getChatHistory(roomId) {
    try {
      if (!this.socket) {
        await this.connect(AppConfig.SOCKET.URL);
      }
      if (!this.isConnected) {
        await this.waitForConnection();
      }

      return new Promise((resolve, reject) => {
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
    } catch (err) {
      console.error("[SocketService] getChatHistory failed:", err);
      throw err;
    }
  }

  joinRoom(roomId) {
    if (!this.socket) return Promise.reject(new Error("Socket missing"));
    this.socket.emit("room:join", { roomId });
    return Promise.resolve();
  }

  leaveRoom(roomId) {
    if (!this.socket) return;
    this.socket.emit("room:leave", { roomId });
  }

  /**
   * Mute a contact or group room
   * @param {string} roomId The ID of the room or group
   * @param {number|null} until Timestamp in ms, or null to unmute
   */
  muteContact(roomId, until) {
    if (!this.socket || !this.userCid) return;
    this.socket.emit("contact:mute", { 
      cid: this.userCid, 
      roomId, 
      until 
    });
  }

  clearChatHistory(roomId) {
    if (!this.socket) return;
    console.log(`[SocketService] Requesting server-side history clear for: ${roomId}`);
    this.socket.emit("room:clearHistory", { roomId });
  }

  updateChatTimer(roomId, timerMs) {
    if (!this.socket) return;
    this.socket.emit("room:timer:update", { roomId, timerMs });
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
