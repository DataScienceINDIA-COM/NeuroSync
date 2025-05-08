// src/lib/firebase-storage.ts
import { getStorage, ref, uploadString, getDownloadURL, deleteObject, type StorageReference } from "firebase/storage";
import { app } from "./firebase"; // Your Firebase app instance
import { generateId } from "./utils";

const storage = getStorage(app);

/**
 * Converts a data URI to a Blob object.
 * @param dataURI The data URI to convert.
 * @returns A Blob object or null if conversion fails.
 */
function dataURIToBlob(dataURI: string): Blob | null {
  if (!dataURI.includes(',')) {
    console.error("Invalid data URI format");
    return null;
  }
  const [metadata, base64Data] = dataURI.split(',');
  if (!metadata || !base64Data) {
    console.error("Invalid data URI structure");
    return null;
  }
  
  const mimeMatch = metadata.match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) {
    console.error("Could not extract MIME type from data URI");
    return null;
  }
  const mimeType = mimeMatch[1];
  
  try {
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  } catch (error) {
    console.error("Error converting base64 to Blob:", error);
    return null;
  }
}


/**
 * Uploads a file (from a data URI) to Firebase Storage.
 * @param dataURI The data URI of the file to upload.
 * @param path The path in Firebase Storage where the file should be stored (e.g., "avatars/userId.png").
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export async function uploadFileFromDataURI(dataURI: string, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  // Firebase's uploadString expects 'data_url' format for data URIs.
  // It handles the conversion from base64 internally.
  const snapshot = await uploadString(storageRef, dataURI, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Deletes a file from Firebase Storage.
 * @param filePath The path of the file to delete in Firebase Storage.
 * @returns A promise that resolves when the file is deleted.
 */
export async function deleteFileFromStorage(filePath: string): Promise<void> {
  const storageRef = ref(storage, filePath);
  try {
    await deleteObject(storageRef);
    console.log(`File deleted successfully: ${filePath}`);
  } catch (error: any) {
    // Handle specific errors, e.g., object-not-found
    if (error.code === 'storage/object-not-found') {
      console.warn(`File not found, cannot delete: ${filePath}`);
    } else {
      console.error(`Error deleting file ${filePath}:`, error);
      throw error; // Re-throw other errors
    }
  }
}

/**
 * Uploads an AI-generated avatar image to Firebase Storage.
 * @param userId The ID of the user.
 * @param imageDataURI The data URI of the avatar image.
 * @param previousAvatarPath Optional. The path of the previous avatar to delete.
 * @returns A promise that resolves with the download URL of the uploaded avatar.
 */
export async function uploadAvatarToStorage(userId: string, imageDataURI: string, previousAvatarPath?: string): Promise<string> {
  if (previousAvatarPath) {
    try {
      await deleteFileFromStorage(previousAvatarPath);
    } catch (error) {
      console.warn("Failed to delete previous avatar, proceeding with upload:", error);
      // Non-critical, so we can proceed.
    }
  }
  const fileExtension = imageDataURI.substring(imageDataURI.indexOf('/') + 1, imageDataURI.indexOf(';base64'));
  const avatarPath = `avatars/${userId}/${generateId()}.${fileExtension || 'png'}`;
  const downloadURL = await uploadFileFromDataURI(imageDataURI, avatarPath);
  return downloadURL;
}
