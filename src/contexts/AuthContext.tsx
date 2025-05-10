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
      onboardingCompleted: false, // Initialize onboardingCompleted
    };
    return newProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setAuthUser(currentFirebaseUser); 
      let appUserToSet: AppUser | null = null;
      
      const userKey = currentFirebaseUser 
        ? `${USER_LOCAL_STORAGE_KEY_PREFIX}${currentFirebaseUser.uid}` 
        : `${USER_LOCAL_STORAGE_KEY_PREFIX}guest`;
      
      const storedAppUserString = localStorage.getItem(userKey);

      if (storedAppUserString) {
        try {
          const parsedUser = JSON.parse(storedAppUserString) as AppUser;
          const isStoredUserGuest = parsedUser.id.startsWith('guest_');
          const isCurrentAuthGuest = !currentFirebaseUser;

          if (isStoredUserGuest === isCurrentAuthGuest && (!currentFirebaseUser || parsedUser.id === currentFirebaseUser.uid)) {
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
            appUserToSet = {
              ...createNewAppUser(currentFirebaseUser, isCurrentAuthGuest), 
              ...parsedUser, 
              id: parsedUser.id, 
              name: parsedUser.name || createNewAppUser(currentFirebaseUser, isCurrentAuthGuest).name,
              avatar: parsedUser.avatar || createNewAppUser(currentFirebaseUser, isCurrentAuthGuest).avatar,
              hormoneLevels: parsedUser.hormoneLevels || getRandomHormone(),
              moodLogs: parsedUser.moodLogs || [],
              tasks: parsedUser.tasks && parsedUser.tasks.length > 0 ? parsedUser.tasks : getDefaultTasks(),
              rewards: parsedUser.rewards && parsedUser.rewards.length > 0 ? parsedUser.rewards : getDefaultRewards(isCurrentAuthGuest),
              neuroPoints: typeof parsedUser.neuroPoints === 'number' ? parsedUser.neuroPoints : 0,
              streak: typeof parsedUser.streak === 'number' ? parsedUser.streak : 0,
              lastCompletedDay: typeof parsedUser.lastCompletedDay === 'number' ? parsedUser.lastCompletedDay : null,
              fcmToken: parsedUser.fcmToken || undefined, // Ensure fcmToken is loaded
              onboardingCompleted: typeof parsedUser.onboardingCompleted === 'boolean' ? parsedUser.onboardingCompleted : false, // Load onboardingCompleted
            };

          } else {
            appUserToSet = createNewAppUser(currentFirebaseUser, !currentFirebaseUser);
          }
        } catch (e) {
          appUserToSet = createNewAppUser(currentFirebaseUser, !currentFirebaseUser);
        }
      } else {
        appUserToSet = createNewAppUser(currentFirebaseUser, !currentFirebaseUser);
      }
      
      if (appUserToSet) {
        localStorage.setItem(userKey, JSON.stringify(appUserToSet));
        if (currentFirebaseUser && currentAppUser?.id?.startsWith('guest_')) {
          const guestKey = `${USER_LOCAL_STORAGE_KEY_PREFIX}guest`;
          if (userKey !== guestKey) { 
            localStorage.removeItem(guestKey);
          }
        }
      }
      
      setAppUser(appUserToSet);
      setLoading(false); 
    });

    return () => {
      unsubscribe();
    };
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
