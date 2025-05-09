
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { User as AppUser } from '@/types/user'; 
import { useUser as useAppUser } from '@/contexts/UserContext'; 
import { generateId } from '@/lib/utils';
import { getRandomHormone } from '@/ai/hormone-prediction';

interface AuthContextType {
  authUser: FirebaseUser | null; 
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null); 
  const [loading, setLoading] = useState(true);
  const { setUser: setAppUser } = useAppUser(); 

  const createNewAppUser = (firebaseUser: FirebaseUser | null, isGuest = false): AppUser => {
    const userId = isGuest ? 'guest_' + generateId() : firebaseUser?.uid || generateId(); 
    const userName = isGuest ? "Vibe Explorer" : firebaseUser?.displayName || "Vibe User"; 
    // Use a default placeholder for guest or if Firebase user has no photoURL
    const avatarUrl = isGuest || !firebaseUser?.photoURL 
        ? `https://picsum.photos/seed/${userId}/100/100` 
        : firebaseUser.photoURL;
    
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
        // imagePath will be populated if it's a Firebase Storage URL later
      },
      streak: 0,
      moodLogs: [], 
      fcmToken: undefined, 
    };
    return newProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setAuthUser(currentFirebaseUser); 
      let appUserToSet: AppUser | null = null;
      const userSpecificLocalStorageKeyPrefix = "vibeCheckUser_";

      if (currentFirebaseUser) {
        // Authenticated user
        const userKey = `${userSpecificLocalStorageKeyPrefix}${currentFirebaseUser.uid}`;
        const storedAppUserString = localStorage.getItem(userKey);

        if (storedAppUserString) {
          try {
            const parsedUser = JSON.parse(storedAppUserString) as AppUser;
            // Ensure the stored user ID matches the authenticated user ID
            if (parsedUser && parsedUser.id === currentFirebaseUser.uid) {
              // Fix missing imagePath if imageUrl is from Firebase Storage
              if (parsedUser.avatar && parsedUser.avatar.imageUrl && parsedUser.avatar.imageUrl.includes('firebasestorage.googleapis.com') && !parsedUser.avatar.imagePath) {
                try {
                  const url = new URL(parsedUser.avatar.imageUrl);
                  const pathName = url.pathname;
                  if (pathName.includes('/o/')) {
                    const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
                    parsedUser.avatar.imagePath = decodeURIComponent(objectPathEncoded);
                  }
                } catch (e) {
                  console.warn("AuthContext: Could not parse imagePath from avatar imageUrl", e);
                }
              }
              appUserToSet = parsedUser;
            } else {
              console.warn("AuthContext: Stored AppUser ID mismatch. Creating new one.");
              appUserToSet = createNewAppUser(currentFirebaseUser, false);
            }
          } catch (e) {
            console.error("AuthContext: Failed to parse stored AppUser. Creating new one.", e);
            appUserToSet = createNewAppUser(currentFirebaseUser, false);
          }
        } else {
          appUserToSet = createNewAppUser(currentFirebaseUser, false);
        }
        
        if (appUserToSet) {
          localStorage.setItem(userKey, JSON.stringify(appUserToSet));
        }

      } else {
        // Guest user or signed out
        const guestUserKey = `${userSpecificLocalStorageKeyPrefix}guest`;
        const storedGuestUserString = localStorage.getItem(guestUserKey);
        
        if (storedGuestUserString) {
          try {
            const parsedGuestUser = JSON.parse(storedGuestUserString) as AppUser;
            if (parsedGuestUser && parsedGuestUser.id.startsWith('guest_')) {
              appUserToSet = parsedGuestUser;
            } else {
               console.warn("AuthContext: Stored guest AppUser invalid. Creating new one.");
               appUserToSet = createNewAppUser(null, true);
            }
          } catch (e) {
            console.error("AuthContext: Failed to parse stored guest AppUser. Creating new one.", e);
            appUserToSet = createNewAppUser(null, true);
          }
        } else {
          appUserToSet = createNewAppUser(null, true);
        }

        if (appUserToSet) {
          localStorage.setItem(guestUserKey, JSON.stringify(appUserToSet));
        }
      }
      
      setAppUser(appUserToSet);
      setLoading(false); 
    });

    return () => {
      unsubscribe();
    };
  // IMPORTANT: setAppUser should be stable, but if it's not, add it to dependencies.
  // For now, assuming it's stable as per typical React context patterns.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAppUser]); 


  return (
    <AuthContext.Provider value={{ authUser, loading }}>
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

