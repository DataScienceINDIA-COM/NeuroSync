import type { Avatar } from "@/types/avatar";
import type { Hormone } from "@/types/hormone";
import type { MoodLog } from "@/types/mood";
import type { Reward } from "@/types/reward";
import type { Task } from "@/types/task";

export type User = {
  id: string;
  name: string;
  avatar: Avatar;
  hormoneLevels: Hormone;
  streak: number;
  lastCompletedDay?: number | null; // For streak calculation
  moodLogs: MoodLog[];
  tasks: Task[];
  rewards: Reward[];
  neuroPoints: number;
  fcmToken?: string; // For Firebase Cloud Messaging
  onboardingCompleted: boolean; // Added for persistent onboarding status
};
