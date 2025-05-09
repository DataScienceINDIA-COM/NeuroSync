
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/user';
import { getRandomHormone, predictHormone } from "@/ai/hormone-prediction";
import { generateId } from '@/lib/utils';

// This key will now be dynamic based on user ID from AuthContext, or a guest key.
// const LOCAL_STORAGE_KEY_USER_PREFIX = "vibeCheckUser_";

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Initialized by AuthContext now

  // Load user from localStorage based on UID (done in AuthContext)
  // Save user to localStorage based on UID (done in AuthContext or here if user object itself changes)

  useEffect(() => {
    if (user && typeof window !== 'undefined' && user.id) {
      const key = user.id.startsWith('guest_') ? 'vibeCheckUser_guest' : `vibeCheckUser_${user.id}`;
      localStorage.setItem(key, JSON.stringify(user));
    }
  }, [user]);
  
  // Hormone prediction logic remains, triggered when relevant user data changes
  useEffect(() => {
    if (user) {
      setUser(prevUser => {
        if (!prevUser) return null;
        const newHormones = predictHormone(prevUser); // predictHormone needs to handle null prevUser.moodLogs gracefully
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

