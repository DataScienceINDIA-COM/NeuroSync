
// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import type { App as AdminApp } from 'firebase-admin/app';
import type { Auth as AdminAuth } from 'firebase-admin/auth';
import type { Messaging as AdminMessaging } from 'firebase-admin/messaging';
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';

let app: AdminApp | undefined = undefined;
let authInstance: AdminAuth | undefined = undefined;
let messagingInstance: AdminMessaging | undefined = undefined;
let firestoreInstance: AdminFirestore | undefined = undefined;
let firebaseAdminInitializationError: Error | null = null;

if (!admin.apps.length) {
  try {
    // Try to initialize with application default credentials
    // This requires GOOGLE_APPLICATION_CREDENTIALS to be set in the environment
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // Optionally, specify your databaseURL if using Realtime Database
      // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, 
      // projectId is usually inferred from the service account or environment.
      // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error with default credentials:', error.message);
    // Fallback for environments where applicationDefault might not work or be set up
    // This relies on NEXT_PUBLIC_FIREBASE_PROJECT_ID for a basic initialization,
    // which might be suitable for some emulated environments or limited use cases,
    // but full admin features typically require a service account.
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn("Attempting Firebase Admin initialization using only Project ID (no service account). Ensure GOOGLE_APPLICATION_CREDENTIALS is set for production server environments or full Admin SDK functionality.");
        try {
            app = admin.initializeApp({
                 projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        } catch (fallbackError: any) {
            const errorMessage = `Firebase Admin SDK initialization failed completely. Default credential error: ${error.message}. Fallback init error: ${fallbackError.message}. Ensure GOOGLE_APPLICATION_CREDENTIALS is set or NEXT_PUBLIC_FIREBASE_PROJECT_ID is valid for basic init.`;
            console.error(errorMessage);
            firebaseAdminInitializationError = new Error(errorMessage);
        }
    } else {
        // If GOOGLE_APPLICATION_CREDENTIALS is expected but missing, or another error occurred
        const errorMessage = `Firebase Admin SDK initialization error: ${error.message}. Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is correctly set for the server environment.`;
        console.error(errorMessage);
        firebaseAdminInitializationError = new Error(errorMessage);
    }
  }
} else {
  app = admin.app();
}

if (app && !firebaseAdminInitializationError) {
  try {
    authInstance = admin.auth(app);
    messagingInstance = admin.messaging(app);
    firestoreInstance = admin.firestore(app);
  } catch (serviceError: any) {
    const errorMessage = `Error initializing Firebase Admin services after app init: ${serviceError.message}`;
    console.error(errorMessage);
    firebaseAdminInitializationError = new Error(errorMessage);
    // Nullify instances if service init fails
    authInstance = undefined;
    messagingInstance = undefined;
    firestoreInstance = undefined;
  }
} else {
  // If app itself didn't initialize or there was an early error
  if (!firebaseAdminInitializationError) { // Ensure we don't overwrite a more specific error
    firebaseAdminInitializationError = new Error("Firebase Admin App could not be initialized.");
  }
  authInstance = undefined;
  messagingInstance = undefined;
  firestoreInstance = undefined;
}

// Export potentially undefined services and the error flag
export { 
  app as adminApp, 
  authInstance as adminAuth, 
  messagingInstance as adminMessaging, 
  firestoreInstance as adminDb,
  firebaseAdminInitializationError as adminInitError 
};
