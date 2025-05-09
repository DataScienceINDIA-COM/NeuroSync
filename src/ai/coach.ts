'use client';

import type { Task } from '@/types/task';
import type { User } from '@/types/user';
import { useState, useEffect } from 'react';

export function getAICoachNudge(user: User, incompleteTask: Task | null): string {
  const hour = new Date().getHours();
  let greeting = "Hey";
  if (hour < 12) greeting = "Mornin' sunshine";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  const baseNudges = [
    `What's the vibe today, ${user.name}? Let's make it a good one!`,
    `Ready to slay, ${user.name}? ✨ Let's get this bread!`,
    `Keep that main character energy going, ${user.name}!`,
    `Remember to hydrate, bestie! That H2O glow is real. 💧`,
    `${user.name}, you're doing amazing, sweetie! Keep it up! 💅`,
  ];

  if (incompleteTask) {
    const taskNudges = [
      `Feelin' that ${incompleteTask.name.toLowerCase()}? You got this!`,
      `That task "${incompleteTask.name}" is lookin' at you... 👀 Finish it and feel that W!`,
      `Smash that "${incompleteTask.name}" quest and grab those VibePoints! 🚀`,
    ];
    return `${greeting}! ${taskNudges[Math.floor(Math.random() * taskNudges.length)]}`;
  }
  
  if (user.streak > 0) {
    const streakNudges = [
      `Your ${user.streak}-day streak is fire! 🔥 Keep it lit!`,
      `Day ${user.streak} of being awesome! Let's keep the streak alive!`,
    ];
    return `${greeting}! ${streakNudges[Math.floor(Math.random() * streakNudges.length)]}`;
  }

  return `${greeting}! ${baseNudges[Math.floor(Math.random() * baseNudges.length)]}`;
}

export function useClientSideRandom<T>(items: T[]): T | undefined {
  const [randomItem, setRandomItem] = useState<T | undefined>(undefined);

  useEffect(() => {
    if (items && items.length > 0) {
      const randomIndex = Math.floor(Math.random() * items.length);
      setRandomItem(items[randomIndex]);
    } else {
      setRandomItem(undefined);
    }
  }, [items]); // Re-run if items array reference changes

  return randomItem;
}
