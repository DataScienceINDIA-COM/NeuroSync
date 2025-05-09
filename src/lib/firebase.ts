import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth, signOut } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions'; // Removed httpsCallable as it's not directly used here
import { getDatabase, type Database } from 'firebase/database'; // Removed ref, get, set as not directly used here
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check for essential configuration variables
const isApiKeySet = !!firebaseConfig.apiKey && typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.trim() !== '';
const isProjectIdSet = !!firebaseConfig.projectId && typeof firebaseConfig.projectId === 'string' && firebaseConfig.projectId.trim() !== '';
const isAuthDomainSet = !!firebaseConfig.authDomain && typeof firebaseConfig.authDomain === 'string' && firebaseConfig.authDomain.trim() !== '';


if (!isApiKeySet || !isProjectIdSet || !isAuthDomainSet) {
  const missingVars: string[] = [];
  if (!isApiKeySet) {
    missingVars.push(`NEXT_PUBLIC_FIREBASE_API_KEY (current value: '${firebaseConfig.apiKey === undefined ? "undefined" : firebaseConfig.apiKey}')`);
  }
  if (!isProjectIdSet) {
    missingVars.push(`NEXT_PUBLIC_FIREBASE_PROJECT_ID (current value: '${firebaseConfig.projectId === undefined ? "undefined" : firebaseConfig.projectId}')`);
  }
   if (!isAuthDomainSet) {
    missingVars.push(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (current value: '${firebaseConfig.authDomain === undefined ? "undefined" : firebaseConfig.authDomain}')`);
  }

  const errorMessage = `CRITICAL: Firebase configuration error. The following environment variable(s) are missing, empty, or invalid: 
${missingVars.join('\n')}
Please ensure these are correctly set in your .env.local file.
Refer to your Firebase project settings (Project settings > General > Your apps > Firebase SDK snippet) to get these values.
Also, ensure Authentication providers (e.g., Google, Email/Password) are enabled in your Firebase project console (Authentication > Sign-in method).
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

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e: any) {
     console.error("CRITICAL: Firebase initialization failed:", e.message, "Config was:", firebaseConfig);
     throw new Error(`Firebase initialization failed: ${e.message}. Check your Firebase config in .env.local and Firebase project settings.`);
  }
} else {
  app = getApp();
}

try {
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  const region = process.env.NEXT_PUBLIC_FIREBASE_LOCATION_ID;
  functions = getFunctions(app, region || undefined); 
  database = getDatabase(app);

  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }
} catch (error: any) {
  console.error('Error initializing Firebase services after app initialization:', error.message);
  // Depending on the app's needs, you might throw an error here or allow partial service availability.
  // For an auth-dependent app, this is likely critical.
  throw new Error(`Firebase service initialization failed: ${error.message || error.toString()}.`);
}


const handleSignOut = async (): Promise<void> => {
  try {
    if (auth) { // Ensure auth object is available
      await signOut(auth);
      console.log('User signed out successfully.');
    } else {
      console.warn('Auth object not initialized, cannot sign out.');
      // Potentially try to re-initialize or throw a more specific error
      // For now, just logging a warning.
    }
  } catch (error: any) {
    console.error('Error signing out:', error.message);
    throw error; 
  }
};

const googleAuthProvider = new GoogleAuthProvider();

export { app, db, auth, storage, functions, database, analytics, googleAuthProvider, handleSignOut };
