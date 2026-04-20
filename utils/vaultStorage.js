/**
 * vaultStorage.js — Locksy Vault
 * ─────────────────────────────────────────────────────────────────
 * Local-first, persistent media vault backed by AsyncStorage.
 *
 * Philosophy:
 *  • Media is COPIED into documentDirectory/vault/ — independent of chat or cache.
 *  • Vault items survive message deletion, cache clears, and app restarts.
 *  • Items are only permanently deleted when the user deletes from the Vault screen.
 *  • Items auto-expire after VAULT_EXPIRY_MS (15 days) and are purged on load.
 * ─────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const VAULT_KEY = 'locksy_vault_items';
const VAULT_DIR = `${FileSystem.documentDirectory}vault/`;
const VAULT_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

// ─── Helpers ────────────────────────────────────────────────────

/** Ensure the vault directory exists */
async function ensureVaultDir() {
  const info = await FileSystem.getInfoAsync(VAULT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true });
  }
}

/** Derive a safe filename extension from a mimeType or filename */
function getExtension(mimeType, filename) {
  if (filename) {
    const parts = filename.split('.');
    if (parts.length > 1) return parts[parts.length - 1].split('?')[0].toLowerCase();
  }
  if (!mimeType) return 'bin';
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'audio/m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/aac': 'aac',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };
  return map[mimeType] || 'bin';
}

/** Load raw items from AsyncStorage (no expiry filter) */
async function loadRaw() {
  try {
    const stored = await AsyncStorage.getItem(VAULT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** Persist raw items list to AsyncStorage */
async function persist(items) {
  await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(items));
}

// ─── Public API ─────────────────────────────────────────────────

const vaultStorage = {
  /**
   * Save a media item to the vault.
   *
   * @param {object} params
   * @param {string}  params.id           - Unique message ID (used to deduplicate)
   * @param {'image'|'video'|'file'|'voice'} params.type
   * @param {string}  params.uri          - Local file:// URI **or** data: base64 URI
   * @param {string}  [params.name]       - Filename (e.g. "report.pdf")
   * @param {number}  [params.size]       - File size in bytes
   * @param {string}  [params.mimeType]   - MIME type
   * @param {string}  [params.roomId]     - Source chat room
   * @param {string}  [params.senderNickname]
   * @returns {Promise<object|null>}  The saved vault item record, or null on error
   */
  async saveVaultItem({ id, type, uri, name, size, mimeType, roomId, senderNickname }) {
    try {
      if (!id || !uri) return null;

      await ensureVaultDir();

      const items = await loadRaw();

      // Deduplicate: already saved
      if (items.some(i => i.id === id)) {
        console.log(`[VaultStorage] Already saved item ${id}`);
        return items.find(i => i.id === id);
      }

      const ext = getExtension(mimeType, name);
      const filename = `${id}.${ext}`;
      const destPath = `${VAULT_DIR}${filename}`;

      // Copy / write file to permanent vault directory
      if (uri.startsWith('data:')) {
        // base64 data URI → strip header and write raw bytes
        const base64 = uri.split(',')[1];
        await FileSystem.writeAsStringAsync(destPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (uri.startsWith('file://') || uri.startsWith('/')) {
        // Local file URI → copy
        await FileSystem.copyAsync({ from: uri, to: destPath });
      } else {
        // Unsupported URI scheme — bail
        console.warn('[VaultStorage] Unsupported URI scheme:', uri.slice(0, 30));
        return null;
      }

      const now = Date.now();
      const record = {
        id,
        type,
        localUri: destPath,
        name: name || filename,
        size: size || 0,
        mimeType: mimeType || 'application/octet-stream',
        roomId: roomId || null,
        senderNickname: senderNickname || null,
        createdAt: now,
        expiresAt: now + VAULT_EXPIRY_MS,
        pinned: false,
      };

      items.push(record);
      await persist(items);

      console.log(`[VaultStorage] Saved item ${id} (${type}) at ${destPath}`);
      return record;
    } catch (error) {
      console.error('[VaultStorage] Error saving item:', error);
      return null;
    }
  },

  /**
   * Load all valid (non-expired) vault items, newest first.
   * Expired items are purged from storage + filesystem automatically.
   * @returns {Promise<Array>}
   */
  async getVaultItems() {
    try {
      const items = await loadRaw();
      const now = Date.now();

      const valid = [];
      const expired = [];

      for (const item of items) {
        if (item.expiresAt && item.expiresAt < now) {
          expired.push(item);
        } else {
          valid.push(item);
        }
      }

      // Purge expired in background
      if (expired.length > 0) {
        for (const item of expired) {
          try {
            await FileSystem.deleteAsync(item.localUri, { idempotent: true });
          } catch {}
        }
        await persist(valid);
        console.log(`[VaultStorage] Purged ${expired.length} expired item(s)`);
      }

      // Verify each file still exists (guard against manual fs cleanup)
      const verified = [];
      for (const item of valid) {
        try {
          const info = await FileSystem.getInfoAsync(item.localUri);
          if (info.exists) {
            verified.push(item);
          } else {
            console.warn(`[VaultStorage] File missing, removing record: ${item.id}`);
          }
        } catch {
          verified.push(item); // optimistic keep if check fails
        }
      }

      if (verified.length !== valid.length) {
        await persist(verified);
      }

      // Sort newest first
      return verified.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('[VaultStorage] Error loading items:', error);
      return [];
    }
  },

  /**
   * Filter vault items by type tab.
   * @param {'All'|'Photos'|'Videos'|'Files'|'Voice'} tab
   * @returns {Promise<Array>}
   */
  async getVaultItemsByTab(tab) {
    const all = await this.getVaultItems();
    if (tab === 'All') return all;
    const typeMap = {
      Photos: 'image',
      Videos: 'video',
      Files: 'file',
      Voice: 'voice',
    };
    const targetType = typeMap[tab];
    return targetType ? all.filter(i => i.type === targetType) : all;
  },

  /**
   * Permanently delete a vault item and its file.
   * @param {string} id
   */
  async deleteVaultItem(id) {
    try {
      const items = await loadRaw();
      const item = items.find(i => i.id === id);

      if (item) {
        // Delete the physical file
        await FileSystem.deleteAsync(item.localUri, { idempotent: true });
      }

      const filtered = items.filter(i => i.id !== id);
      await persist(filtered);

      console.log(`[VaultStorage] Permanently deleted item ${id}`);
    } catch (error) {
      console.error('[VaultStorage] Error deleting item:', error);
    }
  },

  /**
   * Toggle the pinned state of a vault item.
   * @param {string} id
   */
  async togglePin(id) {
    try {
      const items = await loadRaw();
      const updated = items.map(i =>
        i.id === id ? { ...i, pinned: !i.pinned } : i
      );
      await persist(updated);
    } catch (error) {
      console.error('[VaultStorage] Error toggling pin:', error);
    }
  },

  /**
   * Get the count of vault items (for badge display).
   * @returns {Promise<number>}
   */
  async getCount() {
    const items = await this.getVaultItems();
    return items.length;
  },
};

export default vaultStorage;
