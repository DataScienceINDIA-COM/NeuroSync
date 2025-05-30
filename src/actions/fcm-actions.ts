
'use server';

import { adminMessaging, adminDb, adminInitError } from '@/lib/firebase-admin';
import type { User } from '@/types/user';
import admin from 'firebase-admin'; // Ensure admin is imported if FieldValue is used directly

interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: string };
}

export async function sendNotificationToUser(userId: string, payload: NotificationPayload) {
  if (adminInitError) {
    console.error('Firebase Admin SDK not initialized. Cannot send notification.', adminInitError.message);
    return { success: false, message: 'Firebase Admin SDK not initialized.' };
  }
  if (!adminMessaging || !adminDb) {
    console.error('Firebase Admin Messaging or Firestore not available. Cannot send notification.');
    return { success: false, message: 'Firebase Admin Messaging or Firestore not available.' };
  }

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error(`User ${userId} not found.`);
      return { success: false, message: `User ${userId} not found.` };
    }

    const userData = userDoc.data() as User;
    const token = userData.fcmToken; 

    if (!token) {
      console.error(`FCM token not found for user ${userId}.`);
      return { success: false, message: `FCM token not found for user ${userId}.` };
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      token: token,
    };

    const response = await adminMessaging.send(message);
    console.log('Successfully sent message:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, message: 'Error sending notification.' };
  }
}

export async function storeUserFCMToken(userId: string, token: string): Promise<{success: boolean, message?: string}> {
  if (adminInitError) {
    console.error('Firebase Admin SDK not initialized. Cannot store FCM token.', adminInitError.message);
    return { success: false, message: 'Firebase Admin SDK not initialized.' };
  }
  if (!adminDb) {
    console.error('Firebase Admin Firestore not available. Cannot store FCM token.');
    return { success: false, message: 'Firebase Admin Firestore not available.' };
  }

  if (!userId || !token) {
    return { success: false, message: 'User ID and token are required.' };
  }
  try {
    await adminDb.collection('users').doc(userId).set({
      fcmToken: token,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), 
    }, { merge: true });
    console.log(`FCM token stored for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error storing FCM token:', error);
    return { success: false, message: 'Failed to store FCM token.' };
  }
}
