"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/user';
import { predictHormone } from "@/ai/hormone-prediction"; 
// generateId and getRandomHormone removed as initialization is handled by AuthContext

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_LOCAL_STORAGE_KEY_PREFIX = "vibeCheckUser_"; // Keep for consistency if referenced elsewhere, though AuthContext manages keys now

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Initialized as null, AuthContext will populate it

  // Persist user to localStorage when it changes. AuthContext is the primary loader.
  useEffect(() => {
    if (user && typeof window !== 'undefined' && user.id) {
      const key = user.id.startsWith('guest_') 
        ? `${USER_LOCAL_STORAGE_KEY_PREFIX}guest` 
        : `${USER_LOCAL_STORAGE_KEY_PREFIX}${user.id}`;
      // console.log(`UserContext: Saving user ${user.id} to localStorage with key ${key}.`);
      localStorage.setItem(key, JSON.stringify(user));
    }
  }, [user]);
  
  // Recalculate hormone levels when relevant user data changes
  useEffect(() => {
    if (user) {
      const newHormones = predictHormone(user); 
      
      setUser(prevUser => {
        if (!prevUser) return null;
        if (JSON.stringify(prevUser.hormoneLevels) !== JSON.stringify(newHormones)) {
          // console.log(`UserContext: Updating hormone levels for user ${prevUser.id}.`);
          return { ...prevUser, hormoneLevels: newHormones };
        }
        return prevUser;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, JSON.stringify(user?.tasks), JSON.stringify(user?.moodLogs)]); // Dependencies refined to specific data points


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
