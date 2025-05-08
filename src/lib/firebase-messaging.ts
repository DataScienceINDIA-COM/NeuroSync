// src/lib/firebase-messaging.ts
import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { app } from "./firebase"; // Your Firebase app instance

// Get an instance of Firebase Messaging
const messagingInstance = (typeof window !== 'undefined' && 'Notification' in window) ? getMessaging(app) : null;

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messagingInstance) {
    console.log("Firebase Messaging is not supported in this browser or not initialized.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      // TODO: Get FCM token here using `getToken`
      const currentToken = await getToken(messagingInstance, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // Your VAPID key from Firebase console
      });
      if (currentToken) {
        console.log("FCM Token:", currentToken);
        // You would typically send this token to your server to store it against the user
        return currentToken;
      } else {
        console.log("No registration token available. Request permission to generate one.");
        return null;
      }
    } else {
      console.log("Notification permission denied.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while requesting notification permission or getting token: ", error);
    return null;
  }
};

// Handle incoming messages when the app is in the foreground
export const onMessageListener = (): Promise<() => void> =>
  new Promise((resolve, reject) => {
    if (!messagingInstance) {
      console.log("Firebase Messaging is not supported in this browser or not initialized for onMessageListener.");
      // Resolve with a no-op unsubscribe function if messaging is not available
      resolve(() => {}); 
      return;
    }
    const unsubscribe = onMessage(messagingInstance, (payload: MessagePayload) => {
      console.log("Foreground message received. ", payload);
      // You can display a toast, alert, or update UI here
      // Example: new Notification(payload.notification.title, { body: payload.notification.body });
      // This promise now resolves with the payload for immediate handling if needed,
      // but typically onMessage is a listener, so its main job is to trigger side effects.
      // For this setup, we are more interested in the unsubscribe function.
      // To make it more flexible, we might want to pass a callback to onMessageListener.
      // However, for now, we resolve the unsubscribe function.
    });
    resolve(unsubscribe); // Resolve the promise with the unsubscribe function
  }).catch(error => {
    console.error("Error setting up onMessage listener:", error);
    // Ensure a promise is returned even on error, resolving to a no-op unsubscribe
    return () => {};
  });

// Note: Background message handling is done via the firebase-messaging-sw.js file
// in the public directory.

    