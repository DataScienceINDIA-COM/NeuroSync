
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth, signOut } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { getDatabase, ref as databaseRef, get, set, type Database } from 'firebase/database';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';

// IMPORTANT: Replace with your app's actual Firebase project configuration
// This configuration expects environment variables to be set in your .env file.
// Example .env content:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// ... and so on for other config values.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  locationId: process.env.NEXT_PUBLIC_FIREBASE_LOCATION_ID, // Optional: For specific Cloud Functions region
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Critical check for essential Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errorMessage = `CRITICAL: Firebase API Key or Project ID is missing.
Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are correctly set in your .env file.
Is API Key set? ${!!firebaseConfig.apiKey}
Is Project ID set? ${!!firebaseConfig.projectId}
Refer to Firebase project settings to get these values. You might need to restart your development server after updating the .env file.`;
  console.error(errorMessage);
  // Stop execution if essential Firebase config is missing to make the issue unmissable.
  throw new Error(errorMessage);
}

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let functions: Functions;
let database: Database;
let analytics: Analytics | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  // Pass undefined to getFunctions if locationId is not set, allowing it to use the default region.
  functions = getFunctions(app, firebaseConfig.locationId || undefined);
  database = getDatabase(app);

  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }
} catch (error: any) {
  console.error('Error initializing Firebase services:', error.message);
  // If initialization fails even after config check, re-throw to make it clear Firebase is not usable.
  throw new Error(`Firebase service initialization failed: ${error.message || error.toString()}`);
}


// Function to handle Firebase sign out
const handleSignOut = async (): Promise<void> => {
  try {
    if (auth) {
      await signOut(auth);
      console.log('User signed out successfully.');
    } else {
      console.warn('Auth object not initialized, cannot sign out.');
    }
  } catch (error: any) {
    console.error('Error signing out:', error.message);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Function to upload file to Firebase Storage
const uploadFile = async (file: File, path: string) => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  const { ref, uploadBytesResumable } = await import('firebase/storage');

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        // progress can be tracked here if needed
      },
      (error) => {
        console.error('Error uploading file:', error);
        reject(error);
      },
      () => {
        resolve(uploadTask.snapshot.ref);
      }
    );
  });
};

// Function to download a file from Firebase Storage
const downloadFile = async (path: string) => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  const { ref, getDownloadURL } = await import('firebase/storage');

  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

// Function to call Firebase Cloud Functions
const callFunction = async (name: string, data: any) => {
  if (!functions) {
    throw new Error("Firebase Functions is not initialized.");
  }
  try {
    const callable = httpsCallable(functions, name);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling function ${name}:`, error);
    throw error;
  }
};

// Function to interact with Firebase Realtime Database
const readFromDatabase = async (path: string) => {
  if (!database) {
    throw new Error("Firebase Realtime Database is not initialized.");
  }
  const dbRef = databaseRef(database, path);
  try {
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log("No data available for path:", path);
      return null;
    }
  } catch (error) {
    console.error('Error reading from database:', error);
    throw error;
  }
};

// Function to write to Firebase Realtime Database
const writeToDatabase = async (path: string, data: any) => {
  if (!database) {
    throw new Error("Firebase Realtime Database is not initialized.");
  }
  const dbRef = databaseRef(database, path);
  try {
    await set(dbRef, data);
    console.log(`Data written successfully to ${path}`);
  } catch (error) {
    console.error(`Error writing to database at ${path}:`, error);
    throw error;
  }
};


const googleAuthProvider = new GoogleAuthProvider();

export { app, db, auth, storage, functions, database, analytics, googleAuthProvider, handleSignOut, uploadFile, downloadFile, callFunction, readFromDatabase, writeToDatabase };

