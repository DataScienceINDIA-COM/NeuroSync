export type Task = {
  id: string;
  name: string;
  description: string;
  rewardPoints: number;
  isCompleted: boolean;
  hasNeuroBoost: boolean; // Added as a required field
};
