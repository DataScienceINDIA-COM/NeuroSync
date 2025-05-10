"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/user';
import { getRandomHormone, predictHormone } from "@/ai/hormone-prediction"; 
import { generateId } from '@/lib/utils';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_LOCAL_STORAGE_KEY_PREFIX = "vibeCheckUser_";

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); 

  useEffect(() => {
    if (user && typeof window !== 'undefined' && user.id) {
      const key = user.id.startsWith('guest_') 
        ? `${USER_LOCAL_STORAGE_KEY_PREFIX}guest` 
        : `${USER_LOCAL_STORAGE_KEY_PREFIX}${user.id}`;
      console.log(`UserContext: Saving user ${user.id} to localStorage with key ${key}.`);
      localStorage.setItem(key, JSON.stringify(user));
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      // When user data (like moodLogs or completedTasks) changes, recalculate hormones.
      // For now, we are not passing external activityData.
      // In a future step, if activityData were fetched, it could be passed here.
      const newHormones = predictHormone(user /*, optionalActivityData */); 
      
      setUser(prevUser => {
        if (!prevUser) return null;
        // Only update if hormone levels actually changed to avoid unnecessary re-renders
        if (JSON.stringify(prevUser.hormoneLevels) !== JSON.stringify(newHormones)) {
          console.log(`UserContext: Updating hormone levels for user ${prevUser.id}.`);
          return { ...prevUser, hormoneLevels: newHormones };
        }
        return prevUser;
      });
    }
  // Update dependencies: recalculate hormones if user ID, completed tasks, or mood logs change.
  // Stringifying complex objects like completedTasks and moodLogs for dependency array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, JSON.stringify(user?.completedTasks), JSON.stringify(user?.moodLogs)]);


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
