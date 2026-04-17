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
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[MessageStorage] Error getting messages:', error);
      return [];
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
   * Clear history for a room
   */
  async deleteRoomMessages(roomId) {
    try {
      await AsyncStorage.removeItem(`${MSG_PREFIX}${roomId}`);
      // Remove from list
      const stored = await AsyncStorage.getItem(CHAT_LIST_KEY);
      if (stored) {
        let chatList = JSON.parse(stored);
        chatList = chatList.filter(c => c.roomId !== roomId);
        await AsyncStorage.setItem(CHAT_LIST_KEY, JSON.stringify(chatList));
      }
    } catch (error) {
      console.error('[MessageStorage] Error deleting room messages:', error);
    }
  }
}

const messageStorage = new MessageStorage();
export default messageStorage;
