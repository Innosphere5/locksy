/**
 * messageStorage.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Local persistence for chat messages using AsyncStorage.
 * Messages are stored partitioned by roomId for efficient access.
 * ─────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const MSG_PREFIX = 'losky_msg_';
const CHAT_LIST_KEY = 'losky_chat_list';
const SETTINGS_PREFIX = 'losky_settings_';

class MessageStorage {
  /**
   * Save a single message to local storage
   * @param {string} roomId 
   * @param {object} message 
   */
  async saveMessage(roomId, message) {
    // Hoist stripped message to outer scope so the recovery catch can retry with
    // the already-sanitised object instead of the original bloated payload.
    let messageToSave = null;

    try {
      if (!roomId) return;

      const key = `${MSG_PREFIX}${roomId}`;
      const existingStr = await AsyncStorage.getItem(key);
      const messages = existingStr ? JSON.parse(existingStr) : [];

      // Prevent duplicates by ID
      if (messages.some(m => m.id === message.id)) {
        return;
      }

      // Clone message to avoid modifying in-memory objects used by UI/sockets
      messageToSave = {
        ...message,
        message: (message.message && typeof message.message === 'object')
          ? { ...message.message }
          : message.message
      };

      // Strip large senderAvatar to keep the DB row within Android's CursorWindow
      // 2 MB limit. The UI falls back to contactAvatar / userAvatar when this is null.
      if (messageToSave.senderAvatar) {
        messageToSave.senderAvatar = null;
      }

      if (!messageToSave.createdAt) {
        messageToSave.createdAt = Date.now();
      }

      // AUTO-DELETE LOGIC: Check for chat timer
      const timerMs = await this.getChatTimer(roomId);
      if (timerMs && timerMs > 0) {
        messageToSave.expireAt = messageToSave.createdAt + timerMs;
      }

      // LEAN STORAGE: Strip local URIs and base64 payloads from media messages.
      // These are re-derived from mediaId (S3 key) on load via downloadAndDecryptFile.
      if (messageToSave.message && typeof messageToSave.message === 'object') {
        const msg = messageToSave.message;
        if (msg.uri) msg.uri = null;
        if (msg.image) msg.image = null;
        if (msg.base64) msg.base64 = null;
      }

      messages.push(messageToSave);

      // Keep only last 100 messages locally to prevent SQLITE_FULL / Row too big
      const limitedMessages = messages.slice(-100);

      await AsyncStorage.setItem(key, JSON.stringify(limitedMessages));

      // Update chat list summary using the lean, saved message format
      await this._updateChatListSummary(roomId, messageToSave, messageToSave.groupId);
    } catch (error) {
      const isSizeError = error.message && (
        error.message.includes('database or disk is full') ||
        error.message.includes('SQLITE_FULL') ||
        error.message.includes('Row too big')
      );

      if (isSizeError) {
        // RECOVERY: Prune 50% of the oldest messages and retry with the
        // already-stripped messageToSave (not the original bloated payload).
        try {
          const key = `${MSG_PREFIX}${roomId}`;
          const current = await AsyncStorage.getItem(key);
          if (current) {
            const msgs = JSON.parse(current);
            const halved = msgs.slice(Math.floor(msgs.length / 2));
            await AsyncStorage.setItem(key, JSON.stringify(halved));

            // Retry with the lean clone. If messageToSave was never built
            // (error came from getItem), fall back to a fresh sanitised clone.
            const retryMsg = messageToSave || message;
            return await this.saveMessage(roomId, retryMsg);
          }
        } catch (innerError) {
          console.error('[MessageStorage] Recovery failed, wiping room as last resort:', innerError);
          await this.clearRoomMessages(roomId);
        }
      } else {
        console.error('[MessageStorage] Error saving message:', error);
      }
    }
  }

  /**
   * Update a specific message's fields without full overwrite logic
   */
  async updateMessage(roomId, messageId, updates) {
    try {
      if (!roomId || !messageId) return;
      const key = `${MSG_PREFIX}${roomId}`;
      const existingStr = await AsyncStorage.getItem(key);
      if (!existingStr) return;

      let messages = JSON.parse(existingStr);
      let updated = false;

      // Sanitise the incoming updates — never allow a bloated senderAvatar
      // to be written back into an existing row via this path.
      const safeUpdates = { ...updates };
      if (safeUpdates.senderAvatar) safeUpdates.senderAvatar = null;
      if (safeUpdates.message && typeof safeUpdates.message === 'object') {
        const msg = { ...safeUpdates.message };
        if (msg.uri) msg.uri = null;
        if (msg.image) msg.image = null;
        if (msg.base64) msg.base64 = null;
        safeUpdates.message = msg;
      }

      messages = messages.map(m => {
        if (m.id === messageId) {
          updated = true;
          return { ...m, ...safeUpdates };
        }
        return m;
      });

      if (updated) {
        await AsyncStorage.setItem(key, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('[MessageStorage] Error updating message:', error);

      const errorStr = error.toString();
      if (errorStr.includes('Row too big') || errorStr.includes('SQLITE_FULL')) {
        const key = `${MSG_PREFIX}${roomId}`;
        await AsyncStorage.removeItem(key);
      }
    }
  }

  /**
   * Update a specific message's status (sent, delivered, read)
   */
  async updateMessageStatus(roomId, messageId, status) {
    try {
      if (!roomId || !messageId) return;
      const key = `${MSG_PREFIX}${roomId}`;
      const existingStr = await AsyncStorage.getItem(key);
      if (!existingStr) return;

      let messages = JSON.parse(existingStr);
      let updated = false;

      messages = messages.map(m => {
        if (m.id === messageId) {
          // Priority: read > delivered > sent
          const statusOrder = { 'read': 3, 'delivered': 2, 'sent': 1, 'sending': 0 };
          const currentOrder = statusOrder[m.status] || 0;
          const newOrder = statusOrder[status] || 0;

          if (newOrder > currentOrder) {
            updated = true;
            return { ...m, status: status };
          }
        }
        return m;
      });

      if (updated) {
        await AsyncStorage.setItem(key, JSON.stringify(messages));
        console.log(`[MessageStorage] Updated message ${messageId} status to ${status} in room ${roomId}`);
      }
    } catch (error) {
      console.error('[MessageStorage] Error updating message status:', error);
      
      const errorStr = error.toString();
      if (errorStr.includes("Row too big") || errorStr.includes("SQLITE_FULL")) {
        console.warn(`[MessageStorage] Row too big error during status update for room ${roomId}. Wiping local history.`);
        const key = `${MSG_PREFIX}${roomId}`;
        await AsyncStorage.removeItem(key);
      }
    }
  }

  /**
   * Internal: Emergency cleanup when disk is full
   * Targets specifically our media files instead of the root directory.
   */
  async _emergencyCleanup() {
    try {
      console.log('[MessageStorage] Starting emergency cleanup of media files...');
      
      const dirs = [FileSystem.cacheDirectory, FileSystem.documentDirectory];
      let deletedCount = 0;

      for (const dir of dirs) {
        if (!dir) continue;
        const files = await FileSystem.readDirectoryAsync(dir);
        for (const file of files) {
          if (file.startsWith('e2ee_') || file.startsWith('media_')) {
            try {
              await FileSystem.deleteAsync(`${dir}${file}`, { idempotent: true });
              deletedCount++;
            } catch (e) {}
          }
        }
      }
      
      console.log(`[MessageStorage] Emergency cleanup completed. Deleted ${deletedCount} files.`);
    } catch (e) {
      console.error('[MessageStorage] Emergency cleanup failed:', e);
    }
  }

  /**
   * Remove media files older than a certain number of days
   * @param {number} days 
   */
  /**
   * Nuclear Option: Clear EVERYTHING from local storage to fix SQLITE_FULL
   */
  async wipeAllStorage() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const locksyKeys = keys.filter(k => k.startsWith('losky_'));
      await AsyncStorage.multiRemove(locksyKeys);
      
      // Also clear filesystem media
      await this._emergencyCleanup();
      
      console.log('[MessageStorage] ALL local data wiped successfully.');
    } catch (e) {
      console.error('[MessageStorage] Wipe failed:', e);
    }
  }

  /**
   * Prune messages that have expired
   */
  async pruneExpiredMessages() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const msgKeys = keys.filter(k => k.startsWith(MSG_PREFIX));
      const now = Date.now();
      let prunedCount = 0;
      const prunedItems = []; // To return for server sync

      for (const key of msgKeys) {
        const roomId = key.replace(MSG_PREFIX, '');
        try {
          const stored = await AsyncStorage.getItem(key);
          if (!stored) continue;

          let messages = JSON.parse(stored);
          
          // Filter out expired messages
          const expired = messages.filter(m => m.expireAt && m.expireAt < now);
          
          if (expired.length > 0) {
            // Cleanup media for expired messages
            for (const m of expired) {
              const msgPayload = m.message;
              const mediaId = m.media_id || (msgPayload && typeof msgPayload === 'object' ? msgPayload.media_id : null);
              
              prunedItems.push({ id: m.id, roomId, mediaId });

              if (msgPayload && typeof msgPayload === 'object' && msgPayload.localFileUri) {
                try {
                  await FileSystem.deleteAsync(msgPayload.localFileUri, { idempotent: true });
                } catch (e) {}
              }
            }
            
            messages = messages.filter(m => !m.expireAt || m.expireAt >= now);
            await AsyncStorage.setItem(key, JSON.stringify(messages));
            prunedCount += expired.length;
            
            // Update chat list summary if last message was pruned
            if (messages.length > 0) {
              await this._updateChatListSummary(roomId, messages[messages.length - 1]);
            } else {
              // Clear summary if no messages left
              await this._updateChatListSummary(roomId, { message: "No messages", timestamp: new Date().toISOString() });
            }
          }
        } catch (roomError) {
          if (roomError.message && roomError.message.includes('Row too big')) {
            console.warn(`[MessageStorage] Row too big error during prune for room ${roomId}. Wiping local history and relying on Cloud fallback.`);
            await this.clearRoomMessages(roomId);
          } else {
            console.error(`[MessageStorage] Error pruning room ${roomId}:`, roomError);
          }
        }
      }
      
      if (prunedCount > 0) {
        console.log(`[MessageStorage] Pruned ${prunedCount} expired messages across all rooms.`);
      }
      return prunedItems;
    } catch (error) {
      console.error('[MessageStorage] Global error in pruneExpiredMessages:', error);
      return [];
    }
  }

  async pruneOldMedia(days = 7) {
    try {
      const now = Date.now();
      const maxAge = days * 24 * 60 * 60 * 1000;
      const dirs = [FileSystem.cacheDirectory, FileSystem.documentDirectory];
      let prunedCount = 0;

      for (const dir of dirs) {
        if (!dir) continue;
        const files = await FileSystem.readDirectoryAsync(dir);
        for (const file of files) {
          if (file.startsWith('e2ee_') || file.startsWith('media_')) {
            const fileUri = `${dir}${file}`;
            const info = await FileSystem.getInfoAsync(fileUri);
            if (info.exists && (now - info.modificationTime * 1000 > maxAge)) {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              prunedCount++;
            }
          }
        }
      }
      if (prunedCount > 0) {
        console.log(`[MessageStorage] Pruned ${prunedCount} old media files.`);
      }
    } catch (e) {
      console.error('[MessageStorage] Failed to prune old media:', e);
    }
  }

  /**
   * Fetch messages for a specific room
   * @param {string} roomId 
   * @returns {Promise<Array>}
   */
  async getMessages(roomId) {
    try {
      if (!roomId) return [];
      const key = `${MSG_PREFIX}${roomId}`;
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return [];

      let messages = JSON.parse(stored);
      const now = Date.now();
      
      // Filter out any messages that should have been pruned but weren't yet
      return messages.filter(m => !m.expireAt || m.expireAt >= now);
    } catch (error) {
      if (error.message && error.message.includes('Row too big')) {
        console.warn('[MessageStorage] Row too big error! Pruning local history and relying on Cloud fallback:', roomId);
        
        // RECOVERY: Clear local but keep a small chunk if possible, or just fetch fresh from server
        await this.clearRoomMessages(roomId);
        console.log('[MessageStorage] Local storage cleared for room. History will be re-synced from AWS Cloud on next load.');
      } else {
        console.error('[MessageStorage] Error getting messages:', error);
      }
      return [];
    }
  }

  /**
   * Get unread count for a specific room
   */
  async getUnreadCount(roomId) {
    try {
      if (!roomId) return 0;
      const key = `${MSG_PREFIX}${roomId}`;
      try {
        const stored = await AsyncStorage.getItem(key);
        if (!stored) return 0;
        const messages = JSON.parse(stored);
        return messages.filter(m => m.sender === 'received' && !m.isRead).length;
      } catch (itemError) {
        if (itemError.message && itemError.message.includes('Row too big')) {
          await this.clearRoomMessages(roomId);
        }
        return 0;
      }
    } catch (error) {
      console.error('[MessageStorage] Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark all messages as read in a room
   */
  async markAsRead(roomId) {
    try {
      if (!roomId) return;
      const key = `${MSG_PREFIX}${roomId}`;
      try {
        const stored = await AsyncStorage.getItem(key);
        if (!stored) return;
        let messages = JSON.parse(stored);
        let updated = false;
        messages = messages.map(m => {
          if (m.sender === 'received' && !m.isRead) {
            updated = true;
            return { ...m, isRead: true };
          }
          return m;
        });
        if (updated) {
          await AsyncStorage.setItem(key, JSON.stringify(messages));
          // Update summary to 0 unread
          await this._updateChatListSummary(roomId, messages[messages.length - 1], null, 0);
        }
      } catch (itemError) {
        if (itemError.message && itemError.message.includes('Row too big')) {
          await this.clearRoomMessages(roomId);
        }
      }
    } catch (error) {
      console.error('[MessageStorage] Error marking as read:', error);
    }
  }

  /**
   * Save settings for a specific chat room
   */
  async saveChatSettings(roomId, settings) {
    try {
      if (!roomId) return;
      const key = `${SETTINGS_PREFIX}${roomId}`;
      await AsyncStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.error('[MessageStorage] Error saving chat settings:', error);
    }
  }

  /**
   * Get settings for a specific chat room
   */
  async getChatSettings(roomId) {
    try {
      if (!roomId) return null;
      const key = `${SETTINGS_PREFIX}${roomId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[MessageStorage] Error getting chat settings:', error);
      return null;
    }
  }

  /**
   * Save message timer for a room (ms)
   */
  async saveChatTimer(roomId, ms) {
    try {
      const settings = (await this.getChatSettings(roomId)) || {};
      settings.timer = ms;
      await this.saveChatSettings(roomId, settings);

      // RETROACTIVE PRUNING: Apply timer to existing messages
      if (ms > 0) {
        const key = `${MSG_PREFIX}${roomId}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          let messages = JSON.parse(stored);
          let updated = false;
          messages = messages.map(m => {
            if (!m.expireAt) {
              updated = true;
              return { ...m, expireAt: (m.createdAt || Date.now()) + ms };
            }
            return m;
          });
          if (updated) {
            await AsyncStorage.setItem(key, JSON.stringify(messages));
            // Trigger a prune pass immediately to wipe them
            return await this.pruneExpiredMessages();
          }
        }
      }
      return [];
    } catch (error) {
      console.error('[MessageStorage] Error saving chat timer:', error);
      return [];
    }
  }

  /**
   * Get message timer for a room
   */
  async getChatTimer(roomId) {
    try {
      const settings = await this.getChatSettings(roomId);
      return settings?.timer || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Save mute status for a room
   * @param {string} roomId 
   * @param {number|null} until - Timestamp in ms, or null to unmute
   */
  async saveMuteStatus(roomId, until) {
    try {
      const settings = (await this.getChatSettings(roomId)) || {};
      settings.mutedUntil = until;
      await this.saveChatSettings(roomId, settings);
      console.log(`[MessageStorage] Mute status updated for ${roomId}: ${until ? new Date(until).toLocaleString() : 'Unmuted'}`);
    } catch (error) {
      console.error('[MessageStorage] Error saving mute status:', error);
    }
  }

  /**
   * Check if a room is muted
   */
  async getMuteStatus(roomId) {
    try {
      const settings = await this.getChatSettings(roomId);
      if (!settings || !settings.mutedUntil) return false;
      
      // Check if mute has expired
      if (settings.mutedUntil < Date.now()) {
        // Auto-unmute if expired
        await this.saveMuteStatus(roomId, null);
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the list of all active chats with their last messages
   * @returns {Promise<Array>}
   */
  async getChatListSub() {
    try {
      // PROACTIVE PRUNING: Cleanup expired messages whenever chat list is requested
      await this.pruneExpiredMessages();

      const stored = await AsyncStorage.getItem(CHAT_LIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[MessageStorage] Error getting chat list:', error);
      return [];
    }
  }

  /**
   * Internal: Update the summary of the last message in a chat
   */
  async _updateChatListSummary(roomId, lastMessage, groupId = null, unreadCount = null) {
    try {
      const targetId = groupId || roomId;
      if (!targetId) return;

      const stored = await AsyncStorage.getItem(CHAT_LIST_KEY);
      let chatList = stored ? JSON.parse(stored) : [];
      
      const index = chatList.findIndex(c => (groupId ? c.groupId === groupId : c.roomId === roomId));
      const msgData = lastMessage.message;
      let summaryText = "Media";
      
      if (typeof msgData === 'string') {
        summaryText = msgData;
      } else if (msgData && typeof msgData === 'object') {
        if (msgData.type === 'image') summaryText = "📷 Photo";
        else if (msgData.type === 'file') summaryText = `📄 Document: ${msgData.name || 'File'}`;
        else if (msgData.text) summaryText = msgData.text;
      }

      // Calculate unread if not provided
      let finalUnread = unreadCount;
      if (finalUnread === null) {
        finalUnread = await this.getUnreadCount(roomId);
      }
      
      const summary = {
        roomId: groupId ? null : roomId,
        groupId: groupId || null,
        lastMessage: summaryText,
        timestamp: lastMessage.timestamp || new Date().toISOString(),
        senderNickname: lastMessage.senderNickname,
        unread: finalUnread,
      };
      
      if (index > -1) {
        chatList[index] = { ...chatList[index], ...summary };
      } else {
        chatList.push(summary);
      }
      
      // Sort by timestamp descending
      chatList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      await AsyncStorage.setItem(CHAT_LIST_KEY, JSON.stringify(chatList));
    } catch (error) {
      console.error('[MessageStorage] Error updating chat list summary:', error);
    }
  }

  /**
   * Remove all messages in a room older than a certain duration
   * @param {string} roomId 
   * @param {number} durationMs 
   */


  /**
   * Clear history for a room (Immediate Wipe)
   */
  async clearRoomMessages(roomId) {
    try {
      if (!roomId) return;
      const key = `${MSG_PREFIX}${roomId}`;
      
      try {
        const existingStr = await AsyncStorage.getItem(key);
        if (existingStr) {
          const messages = JSON.parse(existingStr);
          // Delete all associated files
          for (const m of messages) {
            if (m.message && typeof m.message === 'object' && m.message.localFileUri) {
              try {
                await FileSystem.deleteAsync(m.message.localFileUri, { idempotent: true });
              } catch (e) {
                console.warn('[MessageStorage] Failed to delete file during room clear:', e);
              }
            }
          }
        }
      } catch (getItemError) {
        // If we can't even get the item (e.g. Row too big), we must still proceed to remove it
        console.warn(`[MessageStorage] Could not read ${key} for cleanup (${getItemError.message}). Proceeding with direct removal.`);
      }

      await AsyncStorage.removeItem(key);
      
      // Update chat list to show 'Chat deleted' instead of removing the person
      const stored = await AsyncStorage.getItem(CHAT_LIST_KEY);
      let chatList = stored ? JSON.parse(stored) : [];
      
      let updated = false;
      chatList = chatList.map(c => {
        if (c.roomId === roomId || c.groupId === roomId) {
          updated = true;
          return { 
            ...c, 
            lastMessage: "Chat history deleted", 
            unread: 0, 
            timestamp: new Date().toISOString() 
          };
        }
        return c;
      });

      if (updated) {
        await AsyncStorage.setItem(CHAT_LIST_KEY, JSON.stringify(chatList));
      }
      
    } catch (error) {
      console.error('[MessageStorage] Error clearing room messages:', error);
    }
  }

  // Alias for better naming in group contexts
  async deleteAllMessages(roomId) {
    return this.clearRoomMessages(roomId);
  }

  /**
   * Clear ONLY media from a room to save space
   */
  async clearRoomMedia(roomId) {
    try {
      if (!roomId) return;
      const key = `${MSG_PREFIX}${roomId}`;
      const existingStr = await AsyncStorage.getItem(key);
      if (!existingStr) return;

      let messages = JSON.parse(existingStr);
      let deletedCount = 0;

      for (const m of messages) {
        if (m.message && typeof m.message === 'object') {
          // Delete file if exists
          if (m.message.localFileUri) {
            try {
              await FileSystem.deleteAsync(m.message.localFileUri, { idempotent: true });
            } catch (e) {}
          }
          // Remove media content from the message object
          if (['image', 'video', 'voice', 'file'].includes(m.message.type) || m.isViewOnce) {
            m.message.uri = null;
            m.message.image = null;
            m.message.text = "[Media Deleted]";
            m.message.isMediaDeleted = true;
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        await AsyncStorage.setItem(key, JSON.stringify(messages));
      }
      return deletedCount;
    } catch (error) {
      console.error('[MessageStorage] Error clearing room media:', error);
      return 0;
    }
  }


  /**
   * Delete a specific message from storage
   */
  async deleteMessage(roomId, messageId) {
    try {
      if (!roomId || !messageId) return;
      const key = `${MSG_PREFIX}${roomId}`;
      try {
        const existingStr = await AsyncStorage.getItem(key);
        if (!existingStr) return;
        
        let messages = JSON.parse(existingStr);
        const initialLength = messages.length;
        messages = messages.filter(m => m.id !== messageId);
        
        if (messages.length !== initialLength) {
          // Find the message(s) that were filtered out and cleanup their local files
          const originalMessages = JSON.parse(existingStr);
          const deletedItemIds = originalMessages.filter(m => !messages.some(nm => nm.id === m.id)).map(m => m.id);
          
          for (const id of deletedItemIds) {
             const item = originalMessages.find(m => m.id === id);
             if (item && item.message && typeof item.message === 'object' && item.message.localFileUri) {
               try {
                 await FileSystem.deleteAsync(item.message.localFileUri, { idempotent: true });
                 console.log(`[MessageStorage] Deleted file for message ${id}`);
               } catch (e) {
                 console.warn('[MessageStorage] File cleanup failed during individual delete:', e);
               }
             }
          }

          await AsyncStorage.setItem(key, JSON.stringify(messages));
          
          // If the deleted message was the last one, update the chat summary
          if (messages.length > 0) {
             await this._updateChatListSummary(roomId, messages[messages.length - 1]);
          } else {
             // Provide a blank / reset summary if all messages are deleted
             await this._updateChatListSummary(roomId, { message: "No messages", timestamp: new Date().toISOString() });
          }
          console.log(`[MessageStorage] Deleted message ${messageId} from room ${roomId}`);
        }
      } catch (itemError) {
        if (itemError.message && itemError.message.includes('Row too big')) {
          await this.clearRoomMessages(roomId);
        }
      }
    } catch (error) {
      console.error('[MessageStorage] Error deleting message:', error);
    }
  }
  /**
   * Update reactions for a specific message
   */
  async updateMessageReactions(roomId, messageId, emoji, action) {
    try {
      if (!roomId || !messageId || !emoji) return;
      const key = `${MSG_PREFIX}${roomId}`;
      const existingStr = await AsyncStorage.getItem(key);
      if (!existingStr) return;
      
      let messages = JSON.parse(existingStr);
      let updated = false;

      messages = messages.map(m => {
        if (m.id === messageId) {
          updated = true;
          let reactions = m.reactions || [];
          if (action === 'add' && !reactions.includes(emoji)) {
            reactions.push(emoji);
          } else if (action === 'remove' && reactions.includes(emoji)) {
            reactions = reactions.filter(r => r !== emoji);
          }
          return { ...m, reactions };
        }
        return m;
      });
      
      if (updated) {
        await AsyncStorage.setItem(key, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('[MessageStorage] Error updating reactions:', error);
    }
  }

  /**
   * Mark a message as opened and remove its sensitive content
   */
  async markMessageAsOpened(roomId, messageId) {
    try {
      if (!roomId || !messageId) return;
      const key = `${MSG_PREFIX}${roomId}`;
      const existingStr = await AsyncStorage.getItem(key);
      if (!existingStr) return;
      
      let messages = JSON.parse(existingStr);
      let updated = false;

      messages = messages.map(m => {
        if (m.id === messageId) {
          updated = true;
          // Clean up sensitive content but preserve metadata
          const cleanedMessage = { ...m };
          if (cleanedMessage.message && typeof cleanedMessage.message === 'object') {
            cleanedMessage.message = {
              ...cleanedMessage.message,
              uri: null,
              base64: null,
              isOpened: true,
            };
          }
          cleanedMessage.isOpened = true;
          return cleanedMessage;
        }
        return m;
      });
      
      if (updated) {
        // Find the message we just updated to see if it has a file to delete
        const openedMsg = messages.find(m => m.id === messageId);
        if (openedMsg && openedMsg.message && openedMsg.message.isStoredInFile && openedMsg.message.localFileUri) {
          try {
            await FileSystem.deleteAsync(openedMsg.message.localFileUri, { idempotent: true });
            console.log(`[MessageStorage] Deleted view-once file: ${openedMsg.message.localFileUri}`);
          } catch (e) {
            console.warn('[MessageStorage] Failed to delete view-once file:', e);
          }
          // Remove the URI reference even from the stored object
          openedMsg.message.localFileUri = null;
          openedMsg.message.uri = null;
          openedMsg.message.image = null;
        }

        try {
          await AsyncStorage.setItem(key, JSON.stringify(messages));
          console.log(`[MessageStorage] Message ${messageId} marked as opened in room ${roomId}`);
        } catch (itemError) {
          if (itemError.message && itemError.message.includes('Row too big')) {
            console.error('[MessageStorage] Failed to save opened status - history still too large. Purging.');
            await this.clearRoomMessages(roomId);
          } else {
            throw itemError;
          }
        }
      }
    } catch (error) {
      console.error('[MessageStorage] Error marking message as opened:', error);
    }
  }

  /**
   * Delete multiple messages from storage (Bulk)
   */
  async deleteMessagesBulk(roomId, messageIds) {
    try {
      if (!roomId || !messageIds || messageIds.length === 0) return;
      const key = `${MSG_PREFIX}${roomId}`;
      const existingStr = await AsyncStorage.getItem(key);
      if (!existingStr) return;

      let messages = JSON.parse(existingStr);
      const toDelete = messages.filter(m => messageIds.includes(m.id));

      for (const m of toDelete) {
        if (m.message && typeof m.message === 'object' && m.message.localFileUri) {
          try {
            await FileSystem.deleteAsync(m.message.localFileUri, { idempotent: true });
          } catch (e) {}
        }
      }

      messages = messages.filter(m => !messageIds.includes(m.id));
      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('[MessageStorage] Error in bulk deletion:', error);
    }
  }
}

const messageStorage = new MessageStorage();
export default messageStorage;
