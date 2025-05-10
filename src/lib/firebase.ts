
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth, signOut } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import { getDatabase, type Database } from 'firebase/database';
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

const isApiKeySet = !!firebaseConfig.apiKey && typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.trim() !== '';
const isProjectIdSet = !!firebaseConfig.projectId && typeof firebaseConfig.projectId === 'string' && firebaseConfig.projectId.trim() !== '';
const isAuthDomainSet = !!firebaseConfig.authDomain && typeof firebaseConfig.authDomain === 'string' && firebaseConfig.authDomain.trim() !== '';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let functions: Functions;
let database: Database;
let analytics: Analytics | null = null;
let firebaseInitializationError: Error | null = null;

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
Is API Key set? ${isApiKeySet}
Is Project ID set? ${isProjectIdSet}
Is Auth Domain set? ${isAuthDomainSet}
Please ensure these are correctly set in your .env.local file.
Refer to your Firebase project settings (Project settings > General > Your apps > Firebase SDK snippet) to get these values.
Also, ensure Authentication providers (e.g., Google, Email/Password) are enabled in your Firebase project console (Authentication > Sign-in method).
IMPORTANT: You MUST restart your development server (e.g., 'npm run dev') after updating environment variables.`;
  
  console.error(errorMessage);
  firebaseInitializationError = new Error(errorMessage);
  // Not throwing here to allow build to proceed for "Module not found" diagnosis.
  // The app will likely fail at runtime if Firebase services are used.
}

if (!firebaseInitializationError) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e: any) {
       console.error("CRITICAL: Firebase initialization failed:", e.message, "Config was:", firebaseConfig);
       firebaseInitializationError = new Error(`Firebase initialization failed: ${e.message}. Check your Firebase config in .env.local and Firebase project settings.`);
    }
  } else {
    app = getApp();
  }

  if (!firebaseInitializationError && app!) {
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
      firebaseInitializationError = new Error(`Firebase service initialization failed: ${error.message || error.toString()}.`);
    }
  }
} else {
  // @ts-ignore
  app = null; 
  // @ts-ignore
  db = null;
  // @ts-ignore
  auth = null;
  // @ts-ignore
  storage = null;
  // @ts-ignore
  functions = null;
  // @ts-ignore
  database = null;
}


const handleSignOut = async (): Promise<void> => {
  if (firebaseInitializationError || !auth) {
    console.error('Firebase not properly initialized, cannot sign out.', firebaseInitializationError);
    throw firebaseInitializationError || new Error("Authentication service not ready.");
  }
  try {
    await signOut(auth);
    console.log('User signed out successfully.');
  } catch (error: any) {
    console.error('Error signing out:', error.message);
    throw error; 
  }
};

const googleAuthProvider = new GoogleAuthProvider();

export { app, db, auth, storage, functions, database, analytics, googleAuthProvider, handleSignOut, firebaseInitializationError };
