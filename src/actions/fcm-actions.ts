'use server';

import { adminMessaging, adminDb } from '@/lib/firebase-admin';
import type { User } from '@/types/user';

interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: string };
}

export async function sendNotificationToUser(userId: string, payload: NotificationPayload) {
  try {
    // In a real app, you would fetch the user's document from Firestore to get their FCM token
    // For now, let's assume we can find a user and they have an fcmToken field.
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error(`User ${userId} not found.`);
      return { success: false, message: `User ${userId} not found.` };
    }

    const userData = userDoc.data() as User;
    const token = userData.fcmToken; // Assuming fcmToken is stored on the user document

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

// Example function to store FCM token (you'll call this from the client)
export async function storeUserFCMToken(userId: string, token: string): Promise<{success: boolean, message?: string}> {
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
