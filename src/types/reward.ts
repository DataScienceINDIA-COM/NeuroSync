export type Reward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  isUnlocked: boolean;
  type: "virtual" | "real-world";
};
