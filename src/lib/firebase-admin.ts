// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import type { App as AdminApp } from 'firebase-admin/app';
import type { Messaging as AdminMessaging } from 'firebase-admin/messaging';
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';

let app: AdminApp;

if (!admin.apps.length) {
  // If GOOGLE_APPLICATION_CREDENTIALS environment variable is set,
  // it will be used automatically. Otherwise, you might need to specify
  // `credential: admin.credential.cert(serviceAccount)`
  // where `serviceAccount` is the imported JSON key file.
  // For Firebase Hosting/Functions, it often initializes without explicit credentials.
  try {
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // Optionally, specify your databaseURL if using Realtime Database
      // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, 
      // projectId is usually inferred from the service account or environment.
      // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // Fallback for environments where applicationDefault might not work (e.g. some local setups without GOOGLE_APPLICATION_CREDENTIALS)
    // This relies on NEXT_PUBLIC_FIREBASE_PROJECT_ID being set.
    // This is less secure and should ideally be handled by proper service account setup.
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn("Attempting Firebase Admin initialization without explicit service account. Ensure GOOGLE_APPLICATION_CREDENTIALS is set for production server environments.");
        app = admin.initializeApp({
             projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    } else {
        throw error; // Re-throw if no fallback is possible
    }
  }
} else {
  app = admin.app();
}

const adminAuth = admin.auth;
const adminMessaging: AdminMessaging = admin.messaging();
const adminDb: AdminFirestore = admin.firestore();

export { app as adminApp, adminAuth, adminMessaging, adminDb };
