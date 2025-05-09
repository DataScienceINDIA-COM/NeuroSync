
'use client';

import type { Task } from '@/types/task';
import type { User } from '@/types/user';
import { useState, useEffect } from 'react';
import { getMemory } from '@/tools/memory';
import { getLogger } from '@/tools/logger';
import { Agent } from '@/tools/agent';
import type { Message } from '@/tools/message';
import { MessageType, createMessage } from '@/tools/message';
import { Trigger, createTrigger } from '@/tools/trigger';


// This class definition seems to be for a different purpose than the getAICoachNudge function.
// It's related to task suggestions and uses an Agent model, which is more complex.
// For now, I'll keep it, but it might need to be integrated differently or removed
// if `getAICoachNudge` is the primary intended functionality of this file.
class AICoach extends Agent {
    constructor(name: string, memory: ReturnType<typeof getMemory>, logger: ReturnType<typeof getLogger>) {
        super(name, memory, async (message: Message, agent: Agent) => {
            // Default message handler for AICoach
            logger.log(`AICoach received message: ${message.type}`);
            if (message.type === MessageType.REQUEST_INFORMATION) {
                if(message.content.request === "nudge"){
                    // This is a simplified example.
                    // In a real scenario, you might use LLM to generate a nudge based on user data in message.content
                    const nudge = this.generateNudgeText(message.content.user, message.content.incompleteTask);
                    return createMessage(agent.name, message.sender, MessageType.OBSERVATION, { nudge });
                }
            }
            return createMessage(agent.name, message.sender, MessageType.OBSERVATION, { message: "AICoach doesn't understand this request." });
        });

        // Example trigger: if a task is overdue, send a nudge.
        // This is highly conceptual as "overdue" state isn't managed here.
        const overdueTaskTrigger = createTrigger(
            "overdueTaskNudge",
            "Nudge for Overdue Task",
            "TASK_OVERDUE_EVENT", // This event would need to be emitted from somewhere
            async (message: Message, agent: Agent) => {
                logger.log("Overdue task trigger fired for AICoach");
                // message.content might contain { userId, taskId }
                // Fetch user, task, generate nudge, and send it (e.g., via a notification service or another agent)
                const nudge = `Hey ${message.content.userName}, don't forget about "${message.content.taskName}"!`;
                // This is a placeholder for sending the nudge
                agent.use_llm(`Generate a motivational nudge for a user named ${message.content.userName} who has an overdue task: ${message.content.taskName}`);
                console.log(`NUDGE (to be sent): ${nudge}`);
            }
        );
        this.add_trigger(overdueTaskTrigger);
    }

    generateNudgeText(user: User, incompleteTask: Task | null): string {
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

    async getNudge(user: User, incompleteTask: Task | null): Promise<string> {
        // This method could use the agent's LLM capabilities or more complex logic
        // For now, it calls the existing static-like nudge generation logic
        const message = createMessage("system", this.name, MessageType.REQUEST_INFORMATION, { request: "nudge", user, incompleteTask });
        const response = await this.receive_message(message);
        return response.content.nudge || this.generateNudgeText(user, incompleteTask);
    }
}


// This function is kept for direct use if the Agent model is not needed for simple nudges.
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
