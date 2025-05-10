
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

let app: FirebaseApp | undefined = undefined; // Ensure app can be undefined if init fails
let db: Firestore | undefined = undefined;
let auth: Auth | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;
let functions: Functions | undefined = undefined;
let database: Database | undefined = undefined;
let analytics: Analytics | null = null;
let firebaseInitializationError: Error | null = null;

// Check for essential Firebase config variables
const essentialConfigs: Array<keyof typeof firebaseConfig> = [
  'apiKey', 
  'authDomain', 
  'projectId', 
  'storageBucket', 
  'messagingSenderId', 
  'appId'
];

const missingOrInvalidConfigs = essentialConfigs.filter(key => {
  const value = firebaseConfig[key];
  return !value || typeof value !== 'string' || value.trim() === '' || value.includes('YOUR_');
});

if (missingOrInvalidConfigs.length > 0) {
  const errorDetails = missingOrInvalidConfigs.map(key => 
    `${key} (current value: '${firebaseConfig[key] === undefined ? "undefined" : String(firebaseConfig[key])}')`
  ).join('\n  ');

  const errorMessage = `CRITICAL: Firebase configuration error. The following essential environment variable(s) are missing, empty, invalid, or still using placeholder values:
  ${errorDetails}
Please ensure these are correctly set in your .env.local file.
Refer to your Firebase project settings (Project settings > General > Your apps > Firebase SDK snippet) to get these values.
Also, ensure Authentication providers (e.g., Google, Email/Password) are enabled in your Firebase project console (Authentication > Sign-in method).
IMPORTANT: You MUST restart your development server (e.g., 'npm run dev') after updating environment variables.`;
  
  console.error(errorMessage);
  firebaseInitializationError = new Error(errorMessage);
  // To prevent the app from attempting to use uninitialized Firebase services:
  // Throw error here to halt further execution relying on Firebase client SDK.
  // This makes the "API key not valid" or other Firebase client errors less likely to obscure the root cause.
  // throw firebaseInitializationError; // Commented out to allow build to proceed for Next.js error diagnosis, but in prod this should throw.
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

  if (app && !firebaseInitializationError) { // Ensure app is defined before using it
    try {
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
      const region = process.env.NEXT_PUBLIC_FIREBASE_LOCATION_ID;
      functions = getFunctions(app, region || undefined); 
      database = getDatabase(app);

      if (typeof window !== 'undefined') {
        isSupported().then((supported) => {
          if (supported && firebaseConfig.measurementId) { // Only init analytics if measurementId is present
            analytics = getAnalytics(app);
          }
        });
      }
    } catch (error: any) {
      console.error('Error initializing Firebase services after app initialization:', error.message);
      firebaseInitializationError = new Error(`Firebase service initialization failed: ${error.message || error.toString()}.`);
      // Nullify services if their initialization fails
      db = undefined;
      auth = undefined;
      storage = undefined;
      functions = undefined;
      database = undefined;
      analytics = null;
    }
  }
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

const googleAuthProvider = auth ? new GoogleAuthProvider() : undefined; // Initialize only if auth is available

export { app, db, auth, storage, functions, database, analytics, googleAuthProvider, handleSignOut, firebaseInitializationError };
