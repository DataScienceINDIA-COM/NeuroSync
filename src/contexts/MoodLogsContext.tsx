"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { MoodLog } from '@/types/mood';
import { parseISO } from "date-fns";

const LOCAL_STORAGE_KEY_MOOD = "vibeCheckLogs";

interface MoodLogsContextType {
  moodLogs: MoodLog[];
  setMoodLogs: React.Dispatch<React.SetStateAction<MoodLog[]>>;
  handleLogMood: (newLog: MoodLog) => void;
}

const MoodLogsContext = createContext<MoodLogsContextType | undefined>(undefined);

export const MoodLogsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    if (typeof window !== 'undefined') {
        const storedMoodLogs = localStorage.getItem(LOCAL_STORAGE_KEY_MOOD);
        if (storedMoodLogs) {
          try {
            const parsedLogs = JSON.parse(storedMoodLogs) as MoodLog[];
            return parsedLogs.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
          } catch (error) {
            console.error("Failed to parse mood logs from localStorage", error);
            localStorage.removeItem(LOCAL_STORAGE_KEY_MOOD);
            return []; 
          }
        }
    }
    return []; 
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_MOOD, JSON.stringify(moodLogs));
    }
  }, [moodLogs]);

  const handleLogMood = (newLog: MoodLog) => {
    setMoodLogs((prevLogs) =>
      [newLog, ...prevLogs].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    );
  };

  return (
    <MoodLogsContext.Provider value={{ moodLogs, setMoodLogs, handleLogMood }}>
      {children}
    </MoodLogsContext.Provider>
  );
};

export const useMoodLogs = (): MoodLogsContextType => {
  const context = useContext(MoodLogsContext);
  if (!context) {
    throw new Error("useMoodLogs must be used within a MoodLogsProvider");
  }
  return context;
};
