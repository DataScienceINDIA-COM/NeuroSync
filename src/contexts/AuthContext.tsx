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

const USER_LOCAL_STORAGE_KEY_PREFIX = "vibeCheckUser_";


export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null); 
  const [loading, setLoading] = useState(true);
  const { setUser: setAppUser, user: currentAppUser } = useAppUser(); 

  const createNewAppUser = (firebaseUser: FirebaseUser | null, isGuest = false): AppUser => {
    const userId = isGuest ? 'guest_' + generateId() : firebaseUser?.uid || generateId(); 
    const userName = isGuest ? "Vibe Explorer" : firebaseUser?.displayName || "Vibe User"; 
    const avatarUrl = isGuest || !firebaseUser?.photoURL 
        ? `https://picsum.photos/seed/${userId}/100/100` 
        : firebaseUser.photoURL;
    
    let imagePath: string | undefined = undefined;
    if (avatarUrl && avatarUrl.includes('firebasestorage.googleapis.com')) {
        try {
            const url = new URL(avatarUrl);
            const pathName = url.pathname;
            if (pathName.includes('/o/')) {
                const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
                imagePath = decodeURIComponent(objectPathEncoded);
            }
        } catch (e) {
            console.warn("AuthContext: Could not parse imagePath from avatar imageUrl", e);
        }
    }
    
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
        imagePath: imagePath, 
      },
      streak: 0,
      moodLogs: [], 
      fcmToken: undefined, 
    };
    console.log(`AuthContext: Created new AppUser (${isGuest ? 'Guest' : 'Authenticated'}):`, newProfile);
    return newProfile;
  };

  useEffect(() => {
    console.log("AuthContext: useEffect for onAuthStateChanged running.");
    const unsubscribe = onAuthStateChanged(auth, (currentFirebaseUser) => {
      console.log("AuthContext: onAuthStateChanged callback fired. Firebase user:", currentFirebaseUser?.uid || 'null');
      setAuthUser(currentFirebaseUser); 
      let appUserToSet: AppUser | null = null;
      
      if (currentFirebaseUser) {
        // Authenticated user
        const userKey = `${USER_LOCAL_STORAGE_KEY_PREFIX}${currentFirebaseUser.uid}`;
        console.log(`AuthContext: Authenticated user found. LocalStorage key: ${userKey}`);
        const storedAppUserString = localStorage.getItem(userKey);

        if (storedAppUserString) {
          try {
            const parsedUser = JSON.parse(storedAppUserString) as AppUser;
            if (parsedUser && parsedUser.id === currentFirebaseUser.uid) {
              console.log("AuthContext: Found matching AppUser in localStorage:", parsedUser);
              // Ensure avatar imagePath is correctly set if imageUrl is from Firebase Storage
              if (parsedUser.avatar && parsedUser.avatar.imageUrl && parsedUser.avatar.imageUrl.includes('firebasestorage.googleapis.com') && !parsedUser.avatar.imagePath) {
                try {
                  const url = new URL(parsedUser.avatar.imageUrl);
                  const pathName = url.pathname;
                  if (pathName.includes('/o/')) {
                    const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
                    parsedUser.avatar.imagePath = decodeURIComponent(objectPathEncoded);
                    console.log("AuthContext: Updated imagePath for stored user avatar:", parsedUser.avatar.imagePath);
                  }
                } catch (e) {
                  console.warn("AuthContext: Could not parse imagePath from stored avatar imageUrl", e);
                }
              }
              appUserToSet = parsedUser;
            } else {
              console.warn("AuthContext: Stored AppUser ID mismatch or invalid. Creating new one.");
              appUserToSet = createNewAppUser(currentFirebaseUser, false);
            }
          } catch (e) {
            console.error("AuthContext: Failed to parse stored AppUser. Creating new one.", e);
            appUserToSet = createNewAppUser(currentFirebaseUser, false);
          }
        } else {
          console.log("AuthContext: No AppUser found in localStorage for authenticated user. Creating new one.");
          appUserToSet = createNewAppUser(currentFirebaseUser, false);
        }
        
        if (appUserToSet) {
          localStorage.setItem(userKey, JSON.stringify(appUserToSet));
           // If the guest user was previously active, remove its localStorage entry
          const guestKey = `${USER_LOCAL_STORAGE_KEY_PREFIX}guest`;
          if (currentAppUser && currentAppUser.id.startsWith('guest_')) {
            localStorage.removeItem(guestKey);
            console.log("AuthContext: Removed guest user data from localStorage.");
          }
        }

      } else {
        // Guest user or signed out
        console.log("AuthContext: No Firebase user. Setting up guest AppUser.");
        const guestUserKey = `${USER_LOCAL_STORAGE_KEY_PREFIX}guest`;
        const storedGuestUserString = localStorage.getItem(guestUserKey);
        
        if (storedGuestUserString) {
          try {
            const parsedGuestUser = JSON.parse(storedGuestUserString) as AppUser;
            if (parsedGuestUser && parsedGuestUser.id.startsWith('guest_')) {
              console.log("AuthContext: Found guest AppUser in localStorage:", parsedGuestUser);
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
          console.log("AuthContext: No guest AppUser in localStorage. Creating new one.");
          appUserToSet = createNewAppUser(null, true);
        }

        if (appUserToSet) {
          localStorage.setItem(guestUserKey, JSON.stringify(appUserToSet));
        }
      }
      
      console.log("AuthContext: Setting AppUser in UserContext:", appUserToSet);
      setAppUser(appUserToSet);
      setLoading(false); 
      console.log("AuthContext: Loading state set to false.");
    });

    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAppUser]); // currentAppUser removed from deps to avoid potential loops if it's not stable


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
