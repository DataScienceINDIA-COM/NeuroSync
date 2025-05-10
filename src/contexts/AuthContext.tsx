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
import type { Task } from '@/types/task';
import type { Reward } from '@/types/reward';

interface AuthContextType {
  authUser: FirebaseUser | null; 
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_LOCAL_STORAGE_KEY_PREFIX = "vibeCheckUser_";

// Default initial tasks for a new user
const getDefaultTasks = (): Task[] => [
  { id: generateId(), name: "10 min Zen Time", description: "Quick mindfulness meditation. Slay.", rewardPoints: 10, hasNeuroBoost: true, isCompleted: false },
  { id: generateId(), name: "30 min Move Sesh", description: "Get that body movin'. No cap.", rewardPoints: 20, hasNeuroBoost: false, isCompleted: false },
  { id: generateId(), name: "Read for 20", description: "Expand the mind grapes. Big brain energy.", rewardPoints: 15, hasNeuroBoost: false, isCompleted: false },
];

// Default initial rewards for a new user
const getDefaultRewards = (isGuest: boolean): Reward[] => isGuest ? 
  [{ id: generateId(), name: "Quick Vibe Boost (Guest)", description: "A little something for our guest!", pointsRequired: 20, isUnlocked: false, type: "virtual" }]
  : [
  { id: generateId(), name: "15 Min Guided Chill Sesh", description: "Unlock a new meditation track. Issa vibe.", pointsRequired: 50, isUnlocked: false, type: "virtual" },
  { id: generateId(), name: "Affirmation Pack Drop", description: "Get a fresh pack of positive affirmations. You got this!", pointsRequired: 100, isUnlocked: false, type: "virtual" },
];


export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null); 
  const [loading, setLoading] = useState(true);
  const { setUser: setAppUser, user: currentAppUser } = useAppUser(); 

  const createNewAppUser = (firebaseUser: FirebaseUser | null, isGuest = false): AppUser => {
    const userId = isGuest ? 'guest_' + generateId() : firebaseUser?.uid || generateId(); 
    const userName = isGuest ? "Vibe Explorer" : firebaseUser?.displayName || "Vibe User"; 
    
    // Avatar setup
    const defaultAvatarSeed = userId;
    let avatarImageUrl = `https://picsum.photos/seed/${defaultAvatarSeed}/100/100`;
    let avatarImagePath: string | undefined = undefined;

    if (!isGuest && firebaseUser?.photoURL) {
        avatarImageUrl = firebaseUser.photoURL;
        if (avatarImageUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const url = new URL(avatarImageUrl);
                const pathName = url.pathname;
                if (pathName.includes('/o/')) {
                    const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
                    avatarImagePath = decodeURIComponent(objectPathEncoded);
                }
            } catch (e) {
                console.warn("AuthContext: Could not parse imagePath from firebaseUser.photoURL", e);
            }
        }
    }
    
    const newProfile: AppUser = {
      id: userId,
      name: userName,
      hormoneLevels: getRandomHormone(),
      avatar: {
        id: generateId(),
        name: "Avatar",
        description: "User's Avatar",
        imageUrl: avatarImageUrl,
        imagePath: avatarImagePath, 
      },
      streak: 0,
      lastCompletedDay: null,
      moodLogs: [], 
      tasks: getDefaultTasks(),
      rewards: getDefaultRewards(isGuest),
      neuroPoints: 0,
      fcmToken: undefined, 
    };
    console.log(`AuthContext: Created new AppUser (${isGuest ? 'Guest' : 'Authenticated'}):`, newProfile.id);
    return newProfile;
  };

  useEffect(() => {
    console.log("AuthContext: useEffect for onAuthStateChanged running.");
    const unsubscribe = onAuthStateChanged(auth, (currentFirebaseUser) => {
      console.log("AuthContext: onAuthStateChanged callback fired. Firebase user:", currentFirebaseUser?.uid || 'null');
      setAuthUser(currentFirebaseUser); 
      let appUserToSet: AppUser | null = null;
      
      const userKey = currentFirebaseUser 
        ? `${USER_LOCAL_STORAGE_KEY_PREFIX}${currentFirebaseUser.uid}` 
        : `${USER_LOCAL_STORAGE_KEY_PREFIX}guest`;
      
      console.log(`AuthContext: Determined userKey: ${userKey}`);
      const storedAppUserString = localStorage.getItem(userKey);

      if (storedAppUserString) {
        try {
          const parsedUser = JSON.parse(storedAppUserString) as AppUser;
          // Validate if the loaded user matches the current auth state (e.g. guest vs authenticated)
          const isStoredUserGuest = parsedUser.id.startsWith('guest_');
          const isCurrentAuthGuest = !currentFirebaseUser;

          if (isStoredUserGuest === isCurrentAuthGuest && (!currentFirebaseUser || parsedUser.id === currentFirebaseUser.uid)) {
            console.log("AuthContext: Found matching AppUser in localStorage:", parsedUser.id);
             // Ensure avatar imagePath is correctly set if imageUrl is from Firebase Storage
            if (parsedUser.avatar && parsedUser.avatar.imageUrl && parsedUser.avatar.imageUrl.includes('firebasestorage.googleapis.com') && !parsedUser.avatar.imagePath) {
              try {
                const url = new URL(parsedUser.avatar.imageUrl);
                const pathName = url.pathname;
                if (pathName.includes('/o/')) {
                  const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
                  parsedUser.avatar.imagePath = decodeURIComponent(objectPathEncoded);
                }
              } catch (e) { /* ignore */ }
            }
            // Ensure all fields exist, merge with defaults if necessary for older stored objects
            appUserToSet = {
              ...createNewAppUser(currentFirebaseUser, isCurrentAuthGuest), // provides defaults for all fields
              ...parsedUser, // overrides defaults with stored values
              id: parsedUser.id, // ensure ID is from parsed user if valid
              name: parsedUser.name || createNewAppUser(currentFirebaseUser, isCurrentAuthGuest).name,
              avatar: parsedUser.avatar || createNewAppUser(currentFirebaseUser, isCurrentAuthGuest).avatar,
              hormoneLevels: parsedUser.hormoneLevels || getRandomHormone(),
              moodLogs: parsedUser.moodLogs || [],
              tasks: parsedUser.tasks && parsedUser.tasks.length > 0 ? parsedUser.tasks : getDefaultTasks(),
              rewards: parsedUser.rewards && parsedUser.rewards.length > 0 ? parsedUser.rewards : getDefaultRewards(isCurrentAuthGuest),
              neuroPoints: typeof parsedUser.neuroPoints === 'number' ? parsedUser.neuroPoints : 0,
              streak: typeof parsedUser.streak === 'number' ? parsedUser.streak : 0,
              lastCompletedDay: typeof parsedUser.lastCompletedDay === 'number' ? parsedUser.lastCompletedDay : null,
            };

          } else {
            console.warn(`AuthContext: Stored AppUser type mismatch (guest/auth) or ID mismatch. Stored ID: ${parsedUser.id}, Firebase UID: ${currentFirebaseUser?.uid}. Creating new one.`);
            appUserToSet = createNewAppUser(currentFirebaseUser, !currentFirebaseUser);
          }
        } catch (e) {
          console.error("AuthContext: Failed to parse stored AppUser. Creating new one.", e);
          appUserToSet = createNewAppUser(currentFirebaseUser, !currentFirebaseUser);
        }
      } else {
        console.log(`AuthContext: No AppUser found in localStorage for key ${userKey}. Creating new one.`);
        appUserToSet = createNewAppUser(currentFirebaseUser, !currentFirebaseUser);
      }
      
      if (appUserToSet) {
        localStorage.setItem(userKey, JSON.stringify(appUserToSet));
        // If switching from guest to authenticated, remove old guest data if it exists and is different
        if (currentFirebaseUser && currentAppUser?.id?.startsWith('guest_')) {
          const guestKey = `${USER_LOCAL_STORAGE_KEY_PREFIX}guest`;
          if (userKey !== guestKey) { // Ensure we don't delete the key we just wrote if user becomes guest
            localStorage.removeItem(guestKey);
            console.log("AuthContext: Removed previous guest user data from localStorage.");
          }
        }
      }
      
      console.log("AuthContext: Setting AppUser in UserContext:", appUserToSet?.id);
      setAppUser(appUserToSet);
      setLoading(false); 
      console.log("AuthContext: Loading state set to false.");
    });

    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  // currentAppUser removed from deps to avoid re-triggering excessively.
  // The core logic depends on firebaseUser and what's in localStorage for that user type.
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
