
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { MoodLog } from '@/types/mood';
import { parseISO } from "date-fns";
import { generateId } from '@/lib/utils';

const LOCAL_STORAGE_KEY_MOOD = "vibeCheckMoodLogs"; // Changed key to be more specific

interface MoodLogsContextType {
  moodLogs: MoodLog[];
  setMoodLogs: React.Dispatch<React.SetStateAction<MoodLog[]>>;
  addMoodLog: (newLogData: Omit<MoodLog, 'id'>) => void;
}

const MoodLogsContext = createContext<MoodLogsContextType | undefined>(undefined);

export const MoodLogsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedMoodLogs = localStorage.getItem(LOCAL_STORAGE_KEY_MOOD);
        if (storedMoodLogs) {
          try {
            const parsedLogs = JSON.parse(storedMoodLogs) as MoodLog[];
            // Ensure logs are sorted by date descending on load
            setMoodLogs(
              parsedLogs.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
            );
          } catch (error) {
            console.error("Failed to parse mood logs from localStorage", error);
            // If parsing fails, it might be corrupted data, so clear it.
            localStorage.removeItem(LOCAL_STORAGE_KEY_MOOD); 
            setMoodLogs([]); // Reset to empty array
          }
        } else {
          setMoodLogs([]); // Initialize with empty array if nothing in storage
        }
    }
  }, []); // Load once on mount

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Persist to localStorage whenever moodLogs change
      localStorage.setItem(LOCAL_STORAGE_KEY_MOOD, JSON.stringify(moodLogs));
    }
  }, [moodLogs]);

  const addMoodLog = (newLogData: Omit<MoodLog, 'id'>) => {
    const newLog: MoodLog = { ...newLogData, id: generateId() };
    setMoodLogs((prevLogs) =>
      [newLog, ...prevLogs].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    );
  };

  return (
    <MoodLogsContext.Provider value={{ moodLogs, setMoodLogs, addMoodLog }}>
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
