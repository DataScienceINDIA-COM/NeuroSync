
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
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  // locationId is not a standard Firebase client config property, removing it or ensuring it's for Functions if needed.
  // For functions, it's usually passed when calling getFunctions.
};

// Check for essential configuration variables
const apiKeyMissing = !firebaseConfig.apiKey || typeof firebaseConfig.apiKey !== 'string' || firebaseConfig.apiKey.trim() === '';
const projectIdMissing = !firebaseConfig.projectId || typeof firebaseConfig.projectId !== 'string' || firebaseConfig.projectId.trim() === '';
const authDomainMissing = !firebaseConfig.authDomain || typeof firebaseConfig.authDomain !== 'string' || firebaseConfig.authDomain.trim() === '';


if (apiKeyMissing || projectIdMissing || authDomainMissing) {
  const missingVars: string[] = [];
  if (apiKeyMissing) {
    missingVars.push(`NEXT_PUBLIC_FIREBASE_API_KEY (current value: '${firebaseConfig.apiKey === undefined ? "undefined" : firebaseConfig.apiKey}')`);
  }
  if (projectIdMissing) {
    missingVars.push(`NEXT_PUBLIC_FIREBASE_PROJECT_ID (current value: '${firebaseConfig.projectId === undefined ? "undefined" : firebaseConfig.projectId}')`);
  }
  if (authDomainMissing) {
    missingVars.push(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (current value: '${firebaseConfig.authDomain === undefined ? "undefined" : firebaseConfig.authDomain}')`);
  }

  const errorMessage = `CRITICAL: Firebase configuration error. The following environment variable(s) are missing, empty, or invalid: 
${missingVars.join('\n')}
Please ensure these are correctly set in your .env.local file (or .env if you are not using .local).
Refer to your Firebase project settings (Project settings > General > Your apps > Firebase SDK snippet) to get these values.
Also, ensure Authentication providers (e.g., Google, Email/Password) are enabled in your Firebase project console (Authentication > Sign-in method).
IMPORTANT: You MUST restart your development server (e.g., 'npm run dev') after updating environment variables.`;
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
  // Pass region to getFunctions if process.env.NEXT_PUBLIC_FIREBASE_LOCATION_ID is defined
  const region = process.env.NEXT_PUBLIC_FIREBASE_LOCATION_ID;
  functions = getFunctions(app, region || undefined); // Use region if available
  database = getDatabase(app);

  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }
} catch (error: any) {
  console.error('Error initializing Firebase services:', error.message, firebaseConfig);
  // Add more context to the error, perhaps stringify the config to see what was passed
  throw new Error(`Firebase service initialization failed: ${error.message || error.toString()}. Config used: ${JSON.stringify(firebaseConfig)}`);
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

// Removed unused 'uploadFile', 'downloadFile', 'callFunction', 'readFromDatabase', 'writeToDatabase'
// These were not being used and can be added back if needed, with proper imports from 'firebase/storage' etc.

const googleAuthProvider = new GoogleAuthProvider();

export { app, db, auth, storage, functions, database, analytics, googleAuthProvider, handleSignOut };
