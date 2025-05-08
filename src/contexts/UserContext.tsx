
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/user';
import { getRandomHormone, predictHormone } from "@/ai/hormone-prediction";
import { generateId } from '@/lib/utils';

const LOCAL_STORAGE_KEY_USER = "vibeCheckUser";

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          // Ensure avatar has imagePath if imageUrl looks like a Firebase Storage URL
          if (parsedUser.avatar && parsedUser.avatar.imageUrl.includes('firebasestorage.googleapis.com') && !parsedUser.avatar.imagePath) {
            try {
              const url = new URL(parsedUser.avatar.imageUrl);
              const pathName = url.pathname;
              const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3);
              parsedUser.avatar.imagePath = decodeURIComponent(objectPathEncoded);
            } catch (e) {
              console.warn("Could not parse imagePath from avatar imageUrl", e);
            }
          }
          return parsedUser;
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
        }
      }
    }
    // Default user generation
    const newUserId = generateId();
    const defaultAvatarUrl = `https://picsum.photos/seed/${newUserId}/100/100`;
    return {
      id: newUserId,
      name: "Vibe Lord",
      completedTasks: [],
      claimedRewards: [],
      inProgressTasks: [],
      hormoneLevels: getRandomHormone(),
      avatar: {
        id: generateId(), 
        name: "Default Avatar", 
        description: "User's Default Avatar",
        imageUrl: defaultAvatarUrl, 
        // For picsum, imagePath is not relevant in the same way as Firebase Storage.
        // It could be set to a representation of the picsum URL if needed for consistency,
        // or left undefined. For now, undefined is fine as it's not a managed file.
      },
      streak: 0,
      moodLogs: [], 
    };
  });

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      setUser(prevUser => {
        if (!prevUser) return null;
        const newHormones = predictHormone(prevUser);
        if (JSON.stringify(prevUser.hormoneLevels) !== JSON.stringify(newHormones)) {
          return { ...prevUser, hormoneLevels: newHormones };
        }
        return prevUser;
      });
    }
  }, [user?.id, user?.completedTasks, user?.moodLogs]);


  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

