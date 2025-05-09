
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
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUser: setAppUser, user: appUser } = useAppUser();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // If Firebase user exists, check if an app user profile needs to be created or updated
        // This is a simplified example. In a real app, you might fetch this from Firestore
        // and create it if it doesn't exist.
        if (!appUser || appUser.id !== firebaseUser.uid) {
          // Attempt to load from localStorage first for this UID
          const storedAppUser = localStorage.getItem(`vibeCheckUser_${firebaseUser.uid}`);
          if (storedAppUser) {
            try {
                const parsedUser = JSON.parse(storedAppUser) as AppUser;
                 // Ensure avatar has imagePath if imageUrl looks like a Firebase Storage URL
                if (parsedUser.avatar && parsedUser.avatar.imageUrl.includes('firebasestorage.googleapis.com') && !parsedUser.avatar.imagePath) {
                    try {
                    const url = new URL(parsedUser.avatar.imageUrl);
                    const pathName = url.pathname;
                    const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
                    parsedUser.avatar.imagePath = decodeURIComponent(objectPathEncoded);
                    } catch (e) {
                    console.warn("Could not parse imagePath from avatar imageUrl during auth context load", e);
                    }
                }
                setAppUser(parsedUser);
            } catch (e) {
                console.error("Failed to parse stored app user:", e);
                // Fallback to creating a new one if parsing fails
                createNewAppUser(firebaseUser);
            }
          } else {
             createNewAppUser(firebaseUser);
          }
        }
      } else {
        // User is signed out, clear app-specific user profile
        setAppUser(null);
         // Optionally, clear guest user data from localStorage if desired
        localStorage.removeItem('vibeCheckUser_guest');
        // Or reset to a default guest profile
        // createNewAppUser(null, true); // guest user
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, setAppUser]); // Add appUser and setAppUser to dependencies

  const createNewAppUser = (firebaseUser: FirebaseUser | null, isGuest = false) => {
    const userId = isGuest ? 'guest_' + generateId() : firebaseUser?.uid || generateId();
    const userName = isGuest ? "Vibe Explorer (Guest)" : firebaseUser?.displayName || "Vibe Lord";
    const avatarUrl = isGuest ? `https://picsum.photos/seed/${userId}/100/100` : firebaseUser?.photoURL || `https://picsum.photos/seed/${userId}/100/100`;
    
    const newAppUserProfile: AppUser = {
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
      },
      streak: 0,
      moodLogs: [],
      fcmToken: isGuest ? undefined : appUser?.fcmToken, // Preserve FCM token if appUser context had it, but this needs careful handling on UID change
    };
    setAppUser(newAppUserProfile);
    if (!isGuest && firebaseUser) {
        localStorage.setItem(`vibeCheckUser_${firebaseUser.uid}`, JSON.stringify(newAppUserProfile));
    } else if (isGuest) {
        localStorage.setItem('vibeCheckUser_guest', JSON.stringify(newAppUserProfile));
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading }}>
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
