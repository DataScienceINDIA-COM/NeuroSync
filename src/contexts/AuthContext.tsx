"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { User as AppUser } from '@/types/user'; // App specific user
import { useUser as useAppUser } from '@/contexts/UserContext'; // App specific user context
import { generateId } from '@/lib/utils';
import { getRandomHormone } from '@/ai/hormone-prediction';

interface AuthContextType {
  user: FirebaseUser | null; // Firebase auth user
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null); // Renamed to authUser to avoid confusion
  const [loading, setLoading] = useState(true);
  const { setUser: setAppUser, user: currentAppUser } = useAppUser(); // currentAppUser is the AppUser from UserContext

  const createNewAppUser = (firebaseUser: FirebaseUser | null, isGuest = false): AppUser => {
    const userId = isGuest ? 'guest_' + generateId() : firebaseUser?.uid || generateId(); // Fallback for safety
    const userName = isGuest ? "Vibe Explorer" : firebaseUser?.displayName || "Vibe User"; // Simplified guest name
    const avatarUrl = isGuest ? `https://picsum.photos/seed/${userId}/100/100` : firebaseUser?.photoURL || `https://picsum.photos/seed/${userId}/100/100`;
    
    const newProfile: AppUser = {
      id: userId,
      name: userName,
      completedTasks: [],
      claimedRewards: [],
      inProgressTasks: [],
      hormoneLevels: getRandomHormone(),
      avatar: {
        id: generateId(),
        name: "Avatar",
        description: "User's Avatar",
        imageUrl: avatarUrl,
        // imagePath will be populated if/when an AI avatar is generated
      },
      streak: 0,
      moodLogs: [], // Initialize as empty array
      fcmToken: undefined, // FCM token should be managed separately after login
    };
    return newProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser); // Set the Firebase auth user state

      if (firebaseUser) {
        // User is signed in
        const userKey = `vibeCheckUser_${firebaseUser.uid}`;
        const storedAppUserString = localStorage.getItem(userKey);
        let appUserToSet: AppUser | null = null;

        if (storedAppUserString) {
          try {
            const parsedUser = JSON.parse(storedAppUserString) as AppUser;
            // Basic validation: ensure essential fields exist
            if (parsedUser && parsedUser.id === firebaseUser.uid) {
               // Ensure avatar has imagePath if imageUrl looks like a Firebase Storage URL
                if (parsedUser.avatar && parsedUser.avatar.imageUrl && parsedUser.avatar.imageUrl.includes('firebasestorage.googleapis.com') && !parsedUser.avatar.imagePath) {
                    try {
                        const url = new URL(parsedUser.avatar.imageUrl);
                        const pathName = url.pathname;
                        if (pathName.includes('/o/')) {
                            const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
                            parsedUser.avatar.imagePath = decodeURIComponent(objectPathEncoded);
                        }
                    } catch (e) {
                        console.warn("Could not parse imagePath from avatar imageUrl during auth context load", e);
                    }
                }
              appUserToSet = parsedUser;
            } else {
              console.warn("Stored app user ID mismatch or invalid, creating new one.");
            }
          } catch (e) {
            console.error("Failed to parse stored app user, creating new one:", e);
          }
        }

        if (!appUserToSet) {
          appUserToSet = createNewAppUser(firebaseUser, false);
          localStorage.setItem(userKey, JSON.stringify(appUserToSet));
        }
        setAppUser(appUserToSet);

      } else {
        // User is signed out, set up guest user
        const guestUserKey = 'vibeCheckUser_guest';
        const storedGuestUserString = localStorage.getItem(guestUserKey);
        let guestUserToSet: AppUser | null = null;

        if (storedGuestUserString) {
          try {
            const parsedGuestUser = JSON.parse(storedGuestUserString) as AppUser;
            if (parsedGuestUser && parsedGuestUser.id.startsWith('guest_')) {
              guestUserToSet = parsedGuestUser;
            } else {
               console.warn("Stored guest user invalid, creating new one.");
            }
          } catch (e) {
            console.error("Failed to parse stored guest user, creating new one:", e);
          }
        }
        
        if (!guestUserToSet) {
          guestUserToSet = createNewAppUser(null, true);
          localStorage.setItem(guestUserKey, JSON.stringify(guestUserToSet));
        }
        setAppUser(guestUserToSet);
      }
      setLoading(false); // Auth check complete
    });

    return () => unsubscribe();
  // currentAppUser is removed from dependencies to prevent cycles if its structure changes but ID remains.
  // The logic inside onAuthStateChanged should correctly handle setting appUser based on firebaseUser.
  }, [setAppUser]); 


  return (
    <AuthContext.Provider value={{ user: authUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};