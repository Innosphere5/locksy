import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import AppConfig from '../../config/appConfig';

const API_BASE_URL = AppConfig.MEDIA.BASE_URL;

class MediaService {
  /**
   * Pick an image from the gallery
   */
  async pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  }

  /**
   * Pick a video from the gallery
   */
  async pickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  }

  /**
   * Pick a document
   */
  async pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  }

  /**
   * Compress image before upload (Expo Go compatible)
   */
  async compressImage(uri) {
    try {
      console.log('[MediaService] Compressing image with ImageManipulator:', uri);
      
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Resize to max width of 1200px
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return result.uri;
    } catch (error) {
      console.error('[MediaService] Image compression failed:', error);
      return uri; // Fallback to original
    }
  }

  /**
   * Compress video before upload
   * NOTE: Video compression is NOT supported in standard Expo Go.
   * This now returns the original URI to avoid crashes.
   */
  async compressVideo(uri, onProgress) {
    console.log('[MediaService] Video compression skipped (not supported in Expo Go)');
    if (onProgress) onProgress(1); // Immediate completion
    return uri;
  }

  /**
   * Standard Upload (for files < 50MB)
   */
  async uploadFile(file, userId, onProgress) {
    try {
      const { uri, name, type, size } = file;
      const fileType = type || 'application/octet-stream';

      // Debug Logs
      console.log(`[MediaService] Starting Upload:
        - URI: ${uri}
        - Type: ${fileType}
        - Size: ${size}`);

      // 1. Get pre-signed URL from backend
      const fullUrl = `${API_BASE_URL}/api/media/upload-url`;
      const safeName = (name || `upload-${Date.now()}`).replace(/[\\"]/g, '_');

      const { data: { uploadUrl, fileUrl, key } } = await axios.post(fullUrl, {
        fileName: safeName,
        fileType: fileType,
        fileSize: size,
        userId,
      });

      console.log('[MediaService] Got Upload URL:', uploadUrl);

      // 2. Convert URI to Blob (CRITICAL for S3 PUT)
      const res = await fetch(uri);
      const blob = await res.blob();

      // 3. Upload directly to S3 using PUT
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": fileType
        }
      });

      console.log('[MediaService] S3 Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`S3 Upload Failed with status: ${response.status}`);
      }

      return { fileUrl, key, type: fileType, size };
    } catch (error) {
      console.error('[MediaService] Upload failed:', error);
      throw error;
    }
  }

  /**
   * Multipart Upload (for files > 50MB)
   */
  async uploadLargeFile(file, userId, onProgress) {
    try {
      const { uri, name, type, size } = file;
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const totalParts = Math.ceil(size / CHUNK_SIZE);

      // 1. Initiate multipart upload
      const { data: { uploadId, key } } = await axios.post(`${API_BASE_URL}/api/media/multipart/initiate`, {
        fileName: name || `video-${Date.now()}`,
        fileType: type || 'video/mp4',
        userId,
      });

      const parts = [];
      const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

      // 2. Get pre-signed URLs for all parts
      const { data: { urls } } = await axios.post(`${API_BASE_URL}/api/media/multipart/get-presigned-urls`, {
        key,
        uploadId,
        partNumbers,
      });

      // 3. Upload chunks
      const blob = await this.uriToBlob(uri);
      
      for (let i = 0; i < totalParts; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, size);
        const chunk = blob.slice(start, end);
        const partUrl = urls.find(u => u.partNumber === i + 1).url;

        const response = await axios.put(partUrl, chunk, {
          headers: { 'Content-Type': type || 'application/octet-stream' },
        });

        const etag = response.headers.etag;
        parts.push({ ETag: etag, PartNumber: i + 1 });

        if (onProgress) {
          onProgress(Math.round(((i + 1) / totalParts) * 100));
        }
      }

      // 4. Complete multipart upload
      const { data: { fileUrl } } = await axios.post(`${API_BASE_URL}/api/media/multipart/complete`, {
        key,
        uploadId,
        parts,
      });

      return { fileUrl, key, type, size };
    } catch (error) {
      console.error('[MediaService] Multipart upload failed:', error);
      throw error;
    }
  }

  /**
   * Register media metadata with backend
   */
  async saveMetadata(mediaData, chatId) {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/media/save`, {
        ...mediaData,
        chat_id: chatId,
        sender_id: mediaData.sender_id || 'unknown',
        type: mediaData.type.split('/')[0] || 'doc', // image, video, or doc fallback
      });
      return data.media;
    } catch (error) {
      console.error('[MediaService] Failed to save metadata:', error);
      throw error;
    }
  }

  /**
   * Helper: Convert URI to Blob
   */
  async uriToBlob(uri) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new Error('uriToBlob failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send();
    });
  }
}

const mediaService = new MediaService();
export default mediaService;
