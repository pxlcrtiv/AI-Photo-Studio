import { FileSize } from '../types';

/**
 * Converts a File object to a base64 encoded string.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the base64 string and mimeType, or rejects with an error.
 */
export const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    if (file.size > FileSize.MAX_UPLOAD_BYTES) {
      reject(new Error(`File size exceeds the limit of ${FileSize.MAX_UPLOAD_MB}MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1]; // Get base64 part
      if (base64String) {
        resolve({ base64: base64String, mimeType: file.type });
      } else {
        reject(new Error('Failed to convert file to base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a Blob object to a base64 encoded string.
 * @param blob The Blob object to convert.
 * @returns A Promise that resolves with the base64 string and mimeType, or rejects with an error.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result?.toString().split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error('Failed to convert blob to base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

/**
 * Validates if the given file is an allowed image type.
 * @param file The File object to validate.
 * @returns True if the file is an allowed image type, false otherwise.
 */
export const isValidImageType = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
};