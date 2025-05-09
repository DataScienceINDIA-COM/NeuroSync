
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
  user: FirebaseUser | null; 
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null); 
  const [loading, setLoading] = useState(true);
  const { setUser: setAppUser } = useAppUser(); 

  console.log("AuthContextProvider: Initializing. Loading state:", loading);

  const createNewAppUser = (firebaseUser: FirebaseUser | null, isGuest = false): AppUser => {
    const userId = isGuest ? 'guest_' + generateId() : firebaseUser?.uid || generateId(); 
    const userName = isGuest ? "Vibe Explorer" : firebaseUser?.displayName || "Vibe User"; 
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
      },
      streak: 0,
      moodLogs: [], 
      fcmToken: undefined, 
    };
    console.log(`AuthContextProvider: Created new AppUser profile (${isGuest ? 'Guest' : 'Authenticated'}):`, newProfile);
    return newProfile;
  };

  useEffect(() => {
    console.log("AuthContextProvider: useEffect for onAuthStateChanged attaching listener.");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("AuthContextProvider: onAuthStateChanged triggered. Firebase user:", firebaseUser ? firebaseUser.uid : 'null');
      setAuthUser(firebaseUser); 

      let appUserToSet: AppUser | null = null;

      if (firebaseUser) {
        console.log("AuthContextProvider: Firebase user detected (authenticated).");
        const userKey = `vibeCheckUser_${firebaseUser.uid}`;
        const storedAppUserString = localStorage.getItem(userKey);

        if (storedAppUserString) {
          console.log(`AuthContextProvider: Found stored AppUser for UID ${firebaseUser.uid}.`);
          try {
            const parsedUser = JSON.parse(storedAppUserString) as AppUser;
            if (parsedUser && parsedUser.id === firebaseUser.uid) {
                if (parsedUser.avatar && parsedUser.avatar.imageUrl && parsedUser.avatar.imageUrl.includes('firebasestorage.googleapis.com') && !parsedUser.avatar.imagePath) {
                    try {
                        const url = new URL(parsedUser.avatar.imageUrl);
                        const pathName = url.pathname;
                        if (pathName.includes('/o/')) {
                            const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
                            parsedUser.avatar.imagePath = decodeURIComponent(objectPathEncoded);
                            console.log("AuthContextProvider: Successfully parsed imagePath from avatar URL.");
                        }
                    } catch (e) {
                        console.warn("AuthContextProvider: Could not parse imagePath from avatar imageUrl during auth context load", e);
                    }
                }
              appUserToSet = parsedUser;
              console.log("AuthContextProvider: Loaded AppUser from localStorage:", appUserToSet);
            } else {
              console.warn("AuthContextProvider: Stored AppUser ID mismatch or invalid. Creating new one.");
              appUserToSet = createNewAppUser(firebaseUser, false);
            }
          } catch (e) {
            console.error("AuthContextProvider: Failed to parse stored AppUser. Creating new one:", e);
            appUserToSet = createNewAppUser(firebaseUser, false);
          }
        } else {
          console.log(`AuthContextProvider: No stored AppUser for UID ${firebaseUser.uid}. Creating new one.`);
          appUserToSet = createNewAppUser(firebaseUser, false);
        }
        
        if (appUserToSet) {
          localStorage.setItem(userKey, JSON.stringify(appUserToSet));
          console.log(`AuthContextProvider: Saved AppUser for UID ${firebaseUser.uid} to localStorage.`);
        }

      } else {
        console.log("AuthContextProvider: No Firebase user detected (guest or signed out).");
        const guestUserKey = 'vibeCheckUser_guest';
        const storedGuestUserString = localStorage.getItem(guestUserKey);
        
        if (storedGuestUserString) {
          console.log("AuthContextProvider: Found stored guest AppUser.");
          try {
            const parsedGuestUser = JSON.parse(storedGuestUserString) as AppUser;
            if (parsedGuestUser && parsedGuestUser.id.startsWith('guest_')) {
              appUserToSet = parsedGuestUser;
              console.log("AuthContextProvider: Loaded guest AppUser from localStorage:", appUserToSet);
            } else {
               console.warn("AuthContextProvider: Stored guest AppUser invalid. Creating new one.");
               appUserToSet = createNewAppUser(null, true);
            }
          } catch (e) {
            console.error("AuthContextProvider: Failed to parse stored guest AppUser. Creating new one:", e);
            appUserToSet = createNewAppUser(null, true);
          }
        } else {
          console.log("AuthContextProvider: No stored guest AppUser. Creating new one.");
          appUserToSet = createNewAppUser(null, true);
        }

        if (appUserToSet) {
          localStorage.setItem(guestUserKey, JSON.stringify(appUserToSet));
          console.log("AuthContextProvider: Saved guest AppUser to localStorage.");
        }
      }
      
      if (appUserToSet) {
        setAppUser(appUserToSet);
        console.log("AuthContextProvider: AppUser set in UserContext:", appUserToSet);
      } else {
        // This case should ideally not be reached if createNewAppUser always returns a valid user.
        console.error("AuthContextProvider: Critical error - appUserToSet is null. This should not happen.");
        // Fallback to a new guest user to prevent app from being totally broken if appUserToSet is null
        const fallbackGuest = createNewAppUser(null, true);
        setAppUser(fallbackGuest);
        localStorage.setItem('vibeCheckUser_guest', JSON.stringify(fallbackGuest));
         console.log("AuthContextProvider: Set fallback guest AppUser due to critical error.");
      }

      setLoading(false); 
      console.log("AuthContextProvider: Auth check complete. Loading state set to false.");
    });

    return () => {
      console.log("AuthContextProvider: useEffect for onAuthStateChanged cleaning up listener.");
      unsubscribe();
    };
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
