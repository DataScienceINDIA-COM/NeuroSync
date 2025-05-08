import type { Hormone } from '@/types/hormone';
import type { User } from '@/types/user';

/**
 * Predicts hormone levels based on user data.
 * @param user The user to predict hormone levels for.
 * @returns An object containing predicted hormone levels.
 */
export function predictHormone(user: User): Hormone {
  // Placeholder logic for hormone prediction based on user data
  // This could be more sophisticated, e.g., considering recent activities, mood, etc.
  let dopamine = 50;
  let adrenaline = 30;
  let cortisol = 40;
  let serotonin = 60;

  if (user.completedTasks.some(task => task.name.toLowerCase().includes("exercise"))) {
    dopamine += 10;
    serotonin += 10;
  }
  if (user.completedTasks.some(task => task.name.toLowerCase().includes("meditate"))) {
    cortisol -= 5;
    serotonin += 5;
  }
  // Add more rules based on user properties or activities

  return {
    dopamine: Math.min(100, Math.max(0, Math.floor(dopamine + Math.random() * 10 - 5))),
    adrenaline: Math.min(100, Math.max(0, Math.floor(adrenaline + Math.random() * 10 - 5))),
    cortisol: Math.min(100, Math.max(0, Math.floor(cortisol + Math.random() * 10 - 5))),
    serotonin: Math.min(100, Math.max(0, Math.floor(serotonin + Math.random() * 10 - 5))),
  };
}

/**
 * Generates random initial hormone levels.
 * @returns An object containing initial hormone levels.
 */
export function getRandomHormone(): Hormone {
  return {
    dopamine: Math.min(100, Math.max(0, Math.floor(Math.random() * 30) + 40)), // Base 40-70
    adrenaline: Math.min(100, Math.max(0, Math.floor(Math.random() * 20) + 20)), // Base 20-40
    cortisol: Math.min(100, Math.max(0, Math.floor(Math.random() * 30) + 30)), // Base 30-60
    serotonin: Math.min(100, Math.max(0, Math.floor(Math.random() * 30) + 50)), // Base 50-80
  };
}
