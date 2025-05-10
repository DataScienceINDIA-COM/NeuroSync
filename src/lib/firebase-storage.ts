
// src/lib/firebase-storage.ts
import { getStorage, ref, uploadString, getDownloadURL, deleteObject, type StorageReference } from "firebase/storage";
import { app, firebaseInitializationError } from "./firebase"; 
import { generateId } from "./utils";

// @ts-ignore
const storage = !firebaseInitializationError && app ? getStorage(app) : null;

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
  if (!storage) {
    console.error("Firebase Storage is not initialized. Check Firebase configuration.");
    throw new Error("Firebase Storage is not initialized.");
  }
  const storageRef = ref(storage, path);
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
  if (!storage) {
    console.error("Firebase Storage is not initialized. Check Firebase configuration.");
    throw new Error("Firebase Storage is not initialized.");
  }
  const storageRef = ref(storage, filePath);
  try {
    await deleteObject(storageRef);
    console.log(`File deleted successfully: ${filePath}`);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`File not found, cannot delete: ${filePath}`);
    } else {
      console.error(`Error deleting file ${filePath}:`, error);
      throw error; 
    }
  }
}

/**
 * Uploads an AI-generated avatar image to Firebase Storage.
 * @param userId The ID of the user.
 * @param imageDataURI The data URI of the avatar image.
 * @param previousAvatarPath Optional. The path of the previous avatar to delete.
 * @returns A promise that resolves with an object containing the download URL and storage path of the uploaded avatar.
 */
export async function uploadAvatarToStorage(
  userId: string,
  imageDataURI: string,
  previousAvatarPath?: string
): Promise<{ downloadURL: string; imagePath: string }> {
  if (!storage) {
    console.error("Firebase Storage is not initialized. Check Firebase configuration.");
    throw new Error("Firebase Storage is not initialized.");
  }

  if (previousAvatarPath) {
    try {
      await deleteFileFromStorage(previousAvatarPath);
    } catch (error) {
      console.warn("Failed to delete previous avatar, proceeding with upload:", error);
    }
  }
  const fileExtensionMatch = imageDataURI.match(/data:image\/(.*?);base64,/);
  const fileExtension = fileExtensionMatch ? fileExtensionMatch[1] : 'png';
  
  const avatarPath = `avatars/${userId}/${generateId()}.${fileExtension}`;
  const downloadURL = await uploadFileFromDataURI(imageDataURI, avatarPath);
  
  return { downloadURL, imagePath: avatarPath };
}
