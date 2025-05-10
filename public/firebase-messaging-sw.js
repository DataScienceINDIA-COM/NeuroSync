// public/firebase-messaging-sw.js

// Scripts for firebase and firebase messaging (using compat version for broader SW compatibility patterns)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// IMPORTANT: REPLACE THE PLACEHOLDER VALUES BELOW WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION
const firebaseConfig = {
  apiKey: "YOUR_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "YOUR_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", // This is CRUCIAL
  appId: "YOUR_NEXT_PUBLIC_FIREBASE_APP_ID",
  measurementId: "YOUR_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" // Optional
};

// Initialize the Firebase app in the service worker
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}


// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Vibe Check';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new vibe update!',
    icon: payload.notification?.icon || '/icon.ico', // Ensure you have this icon in /public
    // You can add more options like data, actions, etc.
    data: payload.data // To pass data to the notification click handler
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification);

  event.notification.close();

  // This looks to see if the current is already open and focuses it.
  // If not, it opens a new window.
  // You might want to customize this behavior, e.g., open a specific URL from event.notification.data.url
  
  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Check if the client is already open at the target URL
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no matching client is found, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
