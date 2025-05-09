
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/user';
import { predictHormone } from "@/ai/hormone-prediction"; // getRandomHormone and generateId removed as AuthContext handles creation

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_LOCAL_STORAGE_KEY_PREFIX = "vibeCheckUser_";

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Initialize to null, AuthContext will populate it

  // Save user to localStorage whenever the user object changes.
  // The key is determined by whether the user is a guest or authenticated.
  useEffect(() => {
    if (user && typeof window !== 'undefined' && user.id) {
      const key = user.id.startsWith('guest_') 
        ? `${USER_LOCAL_STORAGE_KEY_PREFIX}guest` 
        : `${USER_LOCAL_STORAGE_KEY_PREFIX}${user.id}`;
      localStorage.setItem(key, JSON.stringify(user));
    }
  }, [user]);
  
  // Hormone prediction logic: triggers when relevant user data parts change
  useEffect(() => {
    if (user) {
      setUser(prevUser => {
        if (!prevUser) return null;
        // Ensure moodLogs is an array before passing to predictHormone
        const moodLogsForPrediction = Array.isArray(prevUser.moodLogs) ? prevUser.moodLogs : [];
        const newHormones = predictHormone({ ...prevUser, moodLogs: moodLogsForPrediction });
        // Only update if hormone levels actually changed to prevent infinite loops
        if (JSON.stringify(prevUser.hormoneLevels) !== JSON.stringify(newHormones)) {
          return { ...prevUser, hormoneLevels: newHormones };
        }
        return prevUser;
      });
    }
  // Dependency array simplified:
  // We rely on `user` object reference changing if its content relevant to hormones changes.
  // More granular dependencies (user.id, user.completedTasks, user.moodLogs) are also possible
  // but can be trickier to manage if these sub-properties are mutated directly.
  // Stringifying complex objects in dependency arrays is generally an anti-pattern.
  // This setup assumes UserContext or other parts of the app set a *new* user object
  // when completedTasks or moodLogs change in a way that should trigger hormone prediction.
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
