import type { Hormone } from '@/types/hormone';
import type { User } from '@/types/user';
import type { MoodLog } from '@/types/mood';
import { parseISO, differenceInHours, isToday, isYesterday } from 'date-fns';

interface ExternalActivityData {
  dailySteps?: number;
  sleepHours?: number;
  avgHeartRateResting?: number;
  avgHeartRateActive?: number;
  // Add more relevant fitness data points here
}

/**
 * Predicts hormone levels based on user data and optional external activity data.
 * This is a heuristic model and not a precise physiological simulation.
 * "Patent-level" is an aspiration; this aims for a more nuanced and plausible calculation.
 * @param user The user to predict hormone levels for.
 * @param activityData Optional external activity data (e.g., from fitness trackers).
 * @returns An object containing predicted hormone levels.
 */
export function predictHormone(user: User, activityData?: ExternalActivityData): Hormone {
  // Baseline levels (could be personalized further in future)
  let dopamine = 50;
  let adrenaline = 30;
  let cortisol = 40;
  let serotonin = 60;

  const now = new Date();

  // --- Mood Log Analysis ---
  if (user.moodLogs && user.moodLogs.length > 0) {
    const recentMoodLogs = user.moodLogs
      .map(log => ({ ...log, parsedDate: parseISO(log.date) }))
      .filter(log => differenceInHours(now, log.parsedDate) <= 72) // Consider last 3 days
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()); // Most recent first

    recentMoodLogs.forEach(log => {
      const hoursAgo = differenceInHours(now, log.parsedDate);
      const recencyWeight = Math.max(0, 1 - hoursAgo / 72); // More recent = higher weight

      // Dopamine modifiers
      if (log.mood === "Happy" || log.mood === "Energetic") dopamine += 5 * recencyWeight;
      if (log.mood === "Sad" || log.mood === "Tired") dopamine -= 3 * recencyWeight;

      // Adrenaline modifiers
      if (log.mood === "Anxious" || log.mood === "Stressed") adrenaline += 7 * recencyWeight;
      if (log.mood === "Energetic") adrenaline += 3 * recencyWeight;
      if (log.mood === "Calm") adrenaline -= 5 * recencyWeight;
      
      // Cortisol modifiers
      if (log.mood === "Stressed" || log.mood === "Anxious") cortisol += 10 * recencyWeight;
      if (log.mood === "Calm" || log.mood === "Happy") cortisol -= 7 * recencyWeight;

      // Serotonin modifiers
      if (log.mood === "Happy" || log.mood === "Calm") serotonin += 8 * recencyWeight;
      if (log.mood === "Sad" || log.mood === "Stressed" || log.mood === "Anxious") serotonin -= 6 * recencyWeight;
    });
  }

  // --- Completed Task Analysis ---
  if (user.completedTasks && user.completedTasks.length > 0) {
    user.completedTasks.forEach(task => {
      // Assuming tasks might have a completion date in a real scenario
      // For now, we consider all completed tasks, with less impact for older ones (conceptual)
      // A simple approach: check if task name implies certain activities
      const taskNameLower = task.name.toLowerCase();

      // Dopamine: boosted by achievement, exercise, creativity
      if (task.hasNeuroBoost) dopamine += 10; else dopamine += 5;
      if (taskNameLower.includes("exercise") || taskNameLower.includes("workout")) dopamine += 5;
      if (taskNameLower.includes("creative") || taskNameLower.includes("art") || taskNameLower.includes("music")) dopamine += 3;
      if (taskNameLower.includes("goal") || taskNameLower.includes("achieve")) dopamine += 7;


      // Adrenaline: short term boost from intense activity (less relevant for long-term hormone profile from completed tasks)
      // Could be relevant if task was "completed just now" and was intense
      if (taskNameLower.includes("urgent") || taskNameLower.includes("rush") || taskNameLower.includes("intense exercise")) adrenaline += 3;


      // Cortisol: reduced by completing stressful tasks, mindfulness
      if (taskNameLower.includes("stress") && taskNameLower.includes("complete")) cortisol -= 5; // e.g. "complete stressful report"
      if (taskNameLower.includes("meditate") || taskNameLower.includes("mindful") || taskNameLower.includes("relax")) cortisol -= 10;
      
      // Serotonin: boosted by social connection, exercise, positive experiences
      if (taskNameLower.includes("social") || taskNameLower.includes("friend") || taskNameLower.includes("connect")) serotonin += 7;
      if (taskNameLower.includes("exercise") || taskNameLower.includes("yoga")) serotonin += 5;
      if (taskNameLower.includes("gratitude") || taskNameLower.includes("kindness")) serotonin += 5;
    });
  }

  // --- Conceptual External Activity Data Modifiers ---
  if (activityData) {
    // Dopamine
    // if (activityData.dailySteps && activityData.dailySteps > 10000) dopamine += 5;

    // Adrenaline (more related to acute events, but resting heart rate might give clues)
    // if (activityData.avgHeartRateActive && activityData.avgHeartRateActive > 150) adrenaline += 2; // Small, short term effect

    // Cortisol
    // if (activityData.sleepHours && activityData.sleepHours < 6) cortisol += 10;
    // if (activityData.sleepHours && activityData.sleepHours > 7.5) cortisol -= 5;
    // if (activityData.avgHeartRateResting && activityData.avgHeartRateResting > 80) cortisol += 5; // Higher resting HR can indicate stress

    // Serotonin
    // if (activityData.sleepHours && activityData.sleepHours > 7) serotonin += 7;
    // if (activityData.dailySteps && activityData.dailySteps > 8000) serotonin += 3;
  }
  
  // Final clamping and rounding
  return {
    dopamine: Math.min(100, Math.max(0, Math.floor(dopamine))),
    adrenaline: Math.min(100, Math.max(0, Math.floor(adrenaline))),
    cortisol: Math.min(100, Math.max(0, Math.floor(cortisol))),
    serotonin: Math.min(100, Math.max(0, Math.floor(serotonin))),
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
