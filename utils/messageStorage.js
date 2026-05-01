/**
 * messageStorage.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Local persistence for chat messages using AsyncStorage.
 * Messages are stored partitioned by roomId for efficient access.
 * ─────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

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
    try {
      if (!roomId) return;
      
      const key = `${MSG_PREFIX}${roomId}`;
      const existingStr = await AsyncStorage.getItem(key);
      const messages = existingStr ? JSON.parse(existingStr) : [];
      
      // Prevent duplicates by ID
      if (messages.some(m => m.id === message.id)) {
        return;
      }
      
      // Add createdAt if missing for auto-delete accuracy
      if (!message.createdAt) {
        message.createdAt = Date.now();
      }

      // --- OFFLOAD LARGE MEDIA TO FILESYSTEM ---
      if (message.message && typeof message.message === 'object') {
        const msgData = message.message;
        const uri = msgData.uri || msgData.image;
        
        if (uri && uri.startsWith('data:')) {
          try {
            const extension = msgData.type === 'video' ? 'mp4' : (msgData.type === 'voice' ? 'm4a' : 'jpg');
            const fileName = `media_${message.id}.${extension}`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            
            // Extract base64 data (strip prefix)
            const base64Data = uri.split(',')[1] || uri;
            
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            // Update message to point to file instead of base64
            if (msgData.uri) msgData.uri = fileUri;
            if (msgData.image) msgData.image = fileUri;
            msgData.isStoredInFile = true;
            msgData.localFileUri = fileUri;
            
            console.log(`[MessageStorage] Media offloaded to file: ${fileName}`);
          } catch (fsError) {
            console.error('[MessageStorage] Failed to offload media to filesystem:', fsError);
            // Fallback: Continue with base64 if it might fit, or let AsyncStorage fail
          }
        }
      }
      
      messages.push(message);
      
      // Limit to last 500 messages per room to keep storage lean
      const limitedMessages = messages.slice(-500);
      
      await AsyncStorage.setItem(key, JSON.stringify(limitedMessages));
      
      // Update chat list summary
      await this._updateChatListSummary(roomId, message, message.groupId);
      
      console.log(`[MessageStorage] Message saved to room ${roomId}`);
    } catch (error) {
      console.error('[MessageStorage] Error saving message:', error);
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
      
      return messages;
    } catch (error) {
      if (error.message && error.message.includes('Row too big')) {
        console.error('[MessageStorage] Row too big error! Wiping corrupted chat storage to recover:', roomId);
        await this.clearRoomMessages(roomId);
      } else {
        console.error('[MessageStorage] Error getting messages:', error);
      }
      return [];
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
   * Get the list of all active chats with their last messages
   * @returns {Promise<Array>}
   */
  async getChatListSub() {
    try {
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
  async _updateChatListSummary(roomId, lastMessage, groupId = null) {
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

      const summary = {
        roomId: groupId ? null : roomId,
        groupId: groupId || null,
        lastMessage: summaryText,
        timestamp: lastMessage.timestamp || new Date().toISOString(),
        senderNickname: lastMessage.senderNickname,
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

      await AsyncStorage.removeItem(key);
      
      // Update chat list to show no messages
      const stored = await AsyncStorage.getItem(CHAT_LIST_KEY);
      let chatList = stored ? JSON.parse(stored) : [];
      chatList = chatList.filter(c => c.roomId !== roomId);
      await AsyncStorage.setItem(CHAT_LIST_KEY, JSON.stringify(chatList));
      
      console.log(`[MessageStorage] History and files cleared for room ${roomId}`);
    } catch (error) {
      console.error('[MessageStorage] Error clearing room messages:', error);
    }
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
        console.log(`[MessageStorage] Purged ${deletedCount} media items from room ${roomId}`);
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
      const existingStr = await AsyncStorage.getItem(key);
      if (!existingStr) return;
      
      let messages = JSON.parse(existingStr);
      const initialLength = messages.length;
      messages = messages.filter(m => m.id !== messageId);
      
      if (messages.length !== initialLength) {
        // Find the message(s) that were filtered out and cleanup their local files
        const deletedMsgs = initialLength - messages.length;
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
}

const messageStorage = new MessageStorage();
export default messageStorage;
