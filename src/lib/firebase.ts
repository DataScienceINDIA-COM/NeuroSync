
import { initializeApp, getApps, getApp, type FirebaseApp, deleteApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth, signOut, User } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { getDatabase, ref as databaseRef, get, set, type Database } from 'firebase/database';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';

// IMPORTANT: Replace with your app's actual Firebase project configuration
// SECURITY RULES EXAMPLES:
// Allow read/write to authenticated users:
//   match /databases/{database}/documents {
//     match /{document=**} {
//       allow read, write: if request.auth != null;
//     }
//   }
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  locationId: process.env.NEXT_PUBLIC_FIREBASE_LOCATION_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth; // Added Auth variable
let storage: FirebaseStorage;
let functions: Functions;
let database: Database;
let analytics: Analytics | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      });
    }
  } else {
    app = getApp();
  }

  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  functions = getFunctions(app, process.env.NEXT_PUBLIC_FIREBASE_LOCATION_ID);
  database = getDatabase(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
}


// Function to handle Firebase sign out
const handleSignOut = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully.');
  } catch (error) {
    console.error('Error signing out:', error);
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
      console.log("No data available");
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


const googleAuthProvider = new GoogleAuthProvider(); // Create a GoogleAuthProvider instance

export { app, db, auth, storage, functions, database, analytics, googleAuthProvider, handleSignOut, uploadFile, downloadFile, callFunction, readFromDatabase, writeToDatabase }; // Export auth and provider
