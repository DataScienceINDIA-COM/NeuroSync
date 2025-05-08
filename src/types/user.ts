import type { Avatar } from "@/types/avatar";
import type { Hormone } from "@/types/hormone";
import type { MoodLog } from "@/types/mood"; // Import MoodLog
import type { Reward } from "@/types/reward";
import type { Task } from "@/types/task";

export type User = {
  id: string;
  name: string;
  avatar: Avatar;
  completedTasks: Task[];
  claimedRewards: Reward[];
  inProgressTasks: Task[];
  hormoneLevels: Hormone;
  streak: number;
  moodLogs?: MoodLog[]; // Add optional moodLogs
};
