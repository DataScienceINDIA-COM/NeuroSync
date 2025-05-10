'use client';

import type { Task } from '@/types/task';
import type { User } from '@/types/user';
import { useState, useEffect } from 'react';

/**
 * Generates a personalized AI coach nudge based on user data and a random task.
 * @param user The user object.
 * @param randomTask A randomly selected incomplete task, or null if none.
 * @returns A string containing the AI coach nudge.
 */
export function getAICoachNudge(user: User, randomTask: Task | null): string {
  const motivationalMessages = [
    "You're doing great, keep up the positive vibes! ✨",
    "Remember to take a moment for yourself today. You deserve it! 💖",
    "Every small step counts towards your big goals. Keep pushing! 🚀",
    "Your energy is contagious! Keep shining, superstar! 🌟",
    "Believe in yourself! You've got this, fam! 💪",
    "Stay hydrated and keep that glow on! 💧",
    "Don't forget to celebrate your wins, no matter how small! 🎉",
  ];

  const taskBasedMessages = (taskName: string) => [
    `Feeling that ${user.moodLogs?.[0]?.mood || 'current'} vibe? Crushing '${taskName}' could totally boost it! Let's get it! 🎯`,
    `Yo, '${taskName}' is on your list! Smash that quest and feel the W. What are you waiting for? 💅`,
    `Low-key, '${taskName}' sounds like a vibe rn. Give it a shot, you might surprise yourself! 😉`,
    `Heard '${taskName}' is calling your name! Imagine the VibePoints... just sayin'. 🤩`,
  ];

  if (randomTask) {
    const messages = taskBasedMessages(randomTask.name);
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
}

/**
 * A custom hook to select a random element from an array on the client-side
 * after initial hydration to avoid mismatches.
 * @param array The array to select a random element from.
 * @returns A random element from the array, or null if the array is empty or not yet processed.
 */
export function useClientSideRandom<T>(array: T[] | undefined | null): T | null {
  const [randomElement, setRandomElement] = useState<T | null>(null);

  useEffect(() => {
    if (array && array.length > 0) {
      const randomIndex = Math.floor(Math.random() * array.length);
      setRandomElement(array[randomIndex]);
    } else {
      setRandomElement(null);
    }
  }, [array]); // Re-run if the array changes

  return randomElement;
}
