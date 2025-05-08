export type Mood = 
  | "Happy" 
  | "Sad" 
  | "Neutral" 
  | "Anxious" 
  | "Calm" 
  | "Energetic" 
  | "Stressed" 
  | "Tired";

export const moodOptions: Mood[] = [
  "Happy", 
  "Sad", 
  "Neutral", 
  "Anxious", 
  "Calm", 
  "Energetic", 
  "Stressed", 
  "Tired"
];

export interface MoodLog {
  id: string; // Unique ID for each log
  date: string; // YYYY-MM-DD
  mood: Mood;
  activities: string[];
  notes?: string;
}

// For charting purposes
export const moodValueMapping: Record<Mood, number> = {
  Happy: 5,
  Energetic: 4,
  Calm: 4,
  Neutral: 3,
  Anxious: 2,
  Stressed: 2,
  Tired: 1,
  Sad: 1,
};
