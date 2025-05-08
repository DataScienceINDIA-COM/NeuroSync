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
          return JSON.parse(storedUser);
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
        }
      }
    }
    // Default user generation
    const newUserId = generateId();
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
        imageUrl: `https://picsum.photos/seed/${newUserId}/100/100`, 
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
    // Predict hormone levels if user exists and completedTasks or moodLogs change
    // This mirrors how predictHormone might be used based on user activities/mood.
    if (user) {
      setUser(prevUser => {
        if (!prevUser) return null;
        const newHormones = predictHormone(prevUser);
        // Only update if hormones actually change to prevent potential loops if predictHormone is not stable
        if (JSON.stringify(prevUser.hormoneLevels) !== JSON.stringify(newHormones)) {
          return { ...prevUser, hormoneLevels: newHormones };
        }
        return prevUser;
      });
    }
  // Watching user.id ensures this runs if the user logs in/out (changes).
  // Watching specific fields like completedTasks or moodLogs can be more granular.
  // For simplicity, if the user object changes (e.g., after a task completion which updates user.completedTasks),
  // this effect will re-evaluate hormone levels.
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
