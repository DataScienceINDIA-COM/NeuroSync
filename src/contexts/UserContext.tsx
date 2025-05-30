"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/user';
import { predictHormone } from "@/ai/hormone-prediction"; 

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
      localStorage.setItem(key, JSON.stringify(user));
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      const newHormones = predictHormone(user); 
      
      setUser(prevUser => {
        if (!prevUser) return null;
        // Only update if hormone levels actually change to avoid infinite loops
        if (JSON.stringify(prevUser.hormoneLevels) !== JSON.stringify(newHormones)) {
          return { ...prevUser, hormoneLevels: newHormones };
        }
        return prevUser;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, JSON.stringify(user?.tasks), JSON.stringify(user?.moodLogs)]);


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
