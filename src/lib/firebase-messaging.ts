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
      
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error("VAPID key is missing. Ensure NEXT_PUBLIC_FIREBASE_VAPID_KEY is set in your environment variables.");
        // Potentially inform the user, though this is a developer configuration issue.
        return null; 
      }

      const currentToken = await getToken(messagingInstance, {
        vapidKey: vapidKey, 
      });

      if (currentToken) {
        console.log("FCM Token:", currentToken);
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
// Modified to accept a callback to handle the payload in the component
export const onMessageListener = (callback: (payload: MessagePayload) => void): Promise<() => void> =>
  new Promise((resolve, reject) => {
    if (!messagingInstance) {
      console.log("Firebase Messaging is not supported in this browser or not initialized for onMessageListener.");
      resolve(() => {}); 
      return;
    }
    
    const unsubscribe = onMessage(messagingInstance, (payload: MessagePayload) => {
      console.log("Foreground message received by listener. ", payload);
      callback(payload); // Execute the callback with the received payload
    });
    console.log("Foreground message listener attached.");
    resolve(() => { console.log("Foreground message listener detached."); unsubscribe()});

  }).catch(error => {
    console.error("Error setting up onMessage listener:", error);
    return () => {};
  });

// Note: Background message handling is done via the firebase-messaging-sw.js file
// in the public directory.
