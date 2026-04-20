/**
 * messageStorage.js — Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Local persistence for chat messages using AsyncStorage.
 * Messages are stored partitioned by roomId for efficient access.
 * ─────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      messages.push(message);
      
      // Limit to last 500 messages per room to keep storage lean
      const limitedMessages = messages.slice(-500);
      
      await AsyncStorage.setItem(key, JSON.stringify(limitedMessages));
      
      // Update chat list summary
      await this._updateChatListSummary(roomId, message);
      
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
      console.error('[MessageStorage] Error getting messages:', error);
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
  async _updateChatListSummary(roomId, lastMessage) {
    try {
      const stored = await AsyncStorage.getItem(CHAT_LIST_KEY);
      let chatList = stored ? JSON.parse(stored) : [];
      
      const index = chatList.findIndex(c => c.roomId === roomId);
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
        roomId,
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
        await AsyncStorage.setItem(key, JSON.stringify(messages));
        console.log(`[MessageStorage] Message ${messageId} marked as opened in room ${roomId}`);
      }
    } catch (error) {
      console.error('[MessageStorage] Error marking message as opened:', error);
    }
  }
}

const messageStorage = new MessageStorage();
export default messageStorage;
