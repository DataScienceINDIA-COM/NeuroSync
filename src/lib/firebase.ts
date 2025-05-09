
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth, signOut } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { getDatabase, ref as databaseRef, get, set, type Database } from 'firebase/database';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  locationId: process.env.NEXT_PUBLIC_FIREBASE_LOCATION_ID, 
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const apiKeyMissing = !firebaseConfig.apiKey || typeof firebaseConfig.apiKey !== 'string' || firebaseConfig.apiKey.trim() === '';
const projectIdMissing = !firebaseConfig.projectId || typeof firebaseConfig.projectId !== 'string' || firebaseConfig.projectId.trim() === '';

if (apiKeyMissing || projectIdMissing) {
  let missingVarsMessageParts = [];
  if (apiKeyMissing) {
    missingVarsMessageParts.push(`NEXT_PUBLIC_FIREBASE_API_KEY (current value: '${firebaseConfig.apiKey === undefined ? "undefined" : firebaseConfig.apiKey}')`);
  }
  if (projectIdMissing) {
    missingVarsMessageParts.push(`NEXT_PUBLIC_FIREBASE_PROJECT_ID (current value: '${firebaseConfig.projectId === undefined ? "undefined" : firebaseConfig.projectId}')`);
  }

  const errorMessage = `CRITICAL: Firebase configuration error. The following environment variable(s) are missing, empty, or invalid: 
${missingVarsMessageParts.join('\n')}
Please ensure these are correctly set in your .env.local file (or .env if you are not using .local).
Refer to your Firebase project settings (Project settings > General > Your apps > Firebase SDK snippet) to get these values.
IMPORTANT: You MUST restart your development server (e.g., 'npm run dev') after updating environment variables.`;
  console.error(errorMessage);
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
  throw new Error(`Firebase service initialization failed: ${error.message || error.toString()}`);
}

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
    throw error; 
  }
};

const uploadFile = async (file: File, path: string) => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  const { ref, uploadBytesResumable } = await import('firebase/storage');

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {},
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
