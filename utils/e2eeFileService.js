import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import nacl from 'tweetnacl';
import { 
  toBase64, 
  fromBase64, 
  generateRandomBytes, 
  computeSHA256Bytes,
  strToBytes
} from './cryptoEngine';
import axios from 'axios';

import AppConfig from '../config/appConfig';

// Backend configuration
const API_URL = AppConfig.MEDIA.BASE_URL;

/**
 * Derive a deterministic file-specific key from session key and file identifier.
 * @param {Uint8Array} sessionKey - The 32-byte shared secret.
 * @param {string} fileId - A unique ID for the file (e.g., S3 key).
 * @returns {Uint8Array} - 32-byte derived file key.
 */
export const deriveFileKey = (sessionKey, fileId) => {
  const fileIdBytes = strToBytes(fileId);
  const combined = new Uint8Array(sessionKey.length + fileIdBytes.length);
  combined.set(sessionKey);
  combined.set(fileIdBytes, sessionKey.length);
  
  return computeSHA256Bytes(combined);
};

/**
 * Encrypts a file on-device, uploads to S3, and saves metadata.
 * @param {Uint8Array} sessionKey - The session key for derivation.
 * @param {string} senderId - CID of the sender.
 * @param {string} receiverId - CID of the receiver.
 * @param {string} chatId - Room/Chat identifier.
 * @param {string} [fileUri] - Optional URI of the file (if already picked).
 * @param {number} [fileSize] - Optional size of the file.
 * @param {function} [onProgress] - Optional progress callback (0-100).
 */
export const uploadE2EEFile = async (sessionKey, senderId, receiverId, chatId, fileUri = null, fileSize = null, onProgress = null) => {
  try {
    let file;

    if (!fileUri) {
      // 1. Pick File if not provided
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }
      file = result.assets[0];
    } else {
      // Use provided URI and size
      file = {
        uri: fileUri,
        name: fileUri.split('/').pop(),
        size: fileSize || 0, // Fallback if size not provided
        mimeType: 'application/octet-stream' // Fallback
      };
    }
    
    // Safety check: 50MB limit (if size is known)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File too large for E2EE processing (Max 50MB)");
    }

    if (onProgress) onProgress(10); // Start progress

    // 2. Request Presigned URL from Backend
    const urlResponse = await axios.post(`${API_URL}/api/media/e2ee/upload-url`, {
      fileName: file.name,
      userId: senderId
    });

    const { uploadUrl, key: s3Key } = urlResponse.data;
    if (onProgress) onProgress(30);

    // 3. Read and Encrypt File
    const b64Data = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const fileBytes = fromBase64(b64Data);
    const fileKey = deriveFileKey(sessionKey, s3Key);
    const nonce = generateRandomBytes(nacl.secretbox.nonceLength);
    const encryptedBytes = nacl.secretbox(fileBytes, nonce, fileKey);
    if (onProgress) onProgress(60);

    // 4. Upload Encrypted Binary to S3
    // Note: XMLHttpRequest is used here to support progress tracking if needed,
    // but fetch is simpler for binary blobs if progress isn't critical.
    // For now, we'll stay with fetch but manually update progress.
    const uploadResult = await fetch(uploadUrl, {
      method: 'PUT',
      body: encryptedBytes,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!uploadResult.ok) {
      throw new Error(`S3 Upload failed with status ${uploadResult.status}`);
    }
    if (onProgress) onProgress(90);

    // 5. Save Metadata to Backend
    const metadataResponse = await axios.post(`${API_URL}/api/media/e2ee/save-metadata`, {
      id: s3Key, // Ensure this matches what backend expects or generates
      key: s3Key,
      nonce: uint8ToB64(nonce),
      file_name: file.name,
      mime_type: file.mimeType || 'application/octet-stream',
      size: file.size,
      sender_id: senderId,
      receiver_id: receiverId,
      chat_id: chatId
    });

    if (onProgress) onProgress(100);

    return {
      ...metadataResponse.data.media,
      fileUrl: uploadUrl.split('?')[0] // Return the S3 clean URL for UI
    };
  } catch (error) {
    console.error("[E2EE-Service] Upload flow error:", error);
    throw error;
  }
};

/**
 * Downloads, decrypts and saves an E2EE file locally.
 */
export const downloadAndDecryptFile = async (sessionKey, mediaMetadata) => {
  try {
    const mediaId = mediaMetadata.id;
    if (!mediaId) throw new Error("Missing media ID for download");

    // 1. Get Download URL and full metadata from backend
    const urlResponse = await axios.get(`${API_URL}/api/media/e2ee/download-url`, {
      params: { media_id: mediaId }
    });

    const { downloadUrl, s3_key, nonce: nonceB64, file_name } = urlResponse.data;

    // 2. Fetch Encrypted Binary
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    
    const reader = new FileReader();
    const encryptedBytes = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    // 3. Decrypt
    const fileKey = deriveFileKey(sessionKey, s3_key);
    const nonce = fromBase64(nonceB64);
    const decryptedBytes = nacl.secretbox.open(encryptedBytes, nonce, fileKey);
    
    if (!decryptedBytes) {
      throw new Error("Decryption failed (Possible tampering or wrong key)");
    }

    // 4. Save to temporary storage
    const b64Decrypted = uint8ToB64(decryptedBytes);
    const fileExt = file_name.split('.').pop();
    const tempUri = `${FileSystem.cacheDirectory}e2ee_${Date.now()}.${fileExt}`;
    
    await FileSystem.writeAsStringAsync(tempUri, b64Decrypted, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return tempUri;
  } catch (error) {
    console.error("[E2EE-Service] Download/Decrypt Error:", error);
    throw error;
  }
};

// Internal helpers
const uint8ToB64 = (u8) => toBase64(u8);
const b64ToUint8 = (b64) => fromBase64(b64);
