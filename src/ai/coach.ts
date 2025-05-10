'use client';

import type { Task } from '@/types/task';
import type { User } from '@/types/user';
import type { MoodLog } from '@/types/mood';
import { useState, useEffect } from 'react';
import { getMemory } from '@/tools/memory';
import { getLogger } from '@/tools/logger';
import { Agent } from '@/tools/agent';
import type { Message } from '@/tools/message';
import { MessageType, createMessage } from '@/tools/message';
import { Trigger, createTrigger } from '@/tools/trigger';
import { runTerminalCommand, simulateUiApproval } from '@/tools/tools'; 

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
                    const nudge = this.generateNudgeText(message.content.user, message.content.incompleteTask, message.content.recentMoodLog);

                    // Example of using runTerminalCommand and handling pending approval
                    const commandResult = await runTerminalCommand('ls -l', true); // Example command requiring approval.
                    // In a real system, if the status is 'pending_approval', the agent would typically
                    // enter a waiting state and wait for a UI response (user approval/rejection)
                    if (commandResult.status === 'pending_approval') {
                        logger.log(`Command '${commandResult.command}' requires user approval. Informing user.`);
                        // Simulate informing the user (in a real app, this would be a UI notification)
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate waiting for approval
                        // Conceptual step: After receiving a real approval response from the UI, the agent would
                        // call a tool to signal the response back to the system.
                        // In this simulation, we directly call the simulateUiApproval tool.
                        if (commandResult.requestId) {
                            logger.log(`Simulating UI approval for request ID: ${commandResult.requestId}`);
                            const approvalResponse = await simulateUiApproval(commandResult.requestId, true); // Simulate user approving the command
                            logger.log(`Simulated approval response: ${JSON.stringify(approvalResponse)}`);
                        }
                        // In a real scenario, you would wait for user input before trying again.
                    }
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

    generateNudgeText(user: User, incompleteTask: Task | null, recentMoodLog?: MoodLog): string {
      return getAICoachNudge(user, incompleteTask); // Delegate to the enhanced function
    }

    async getNudge(user: User, incompleteTask: Task | null): Promise<string> {
        // This method could use the agent's LLM capabilities or more complex logic
        const recentMoodLog = user.moodLogs && user.moodLogs.length > 0 ? user.moodLogs[0] : undefined;
        const message = createMessage("system", this.name, MessageType.REQUEST_INFORMATION, { request: "nudge", user, incompleteTask, recentMoodLog });
        const response = await this.receive_message(message);
        return response.content.nudge || this.generateNudgeText(user, incompleteTask, recentMoodLog);
    }
}


// This function is kept for direct use if the Agent model is not needed for simple nudges.
export function getAICoachNudge(user: User, incompleteTask: Task | null): string {
  const hour = new Date().getHours();
  let greeting = "Hey";
  if (hour < 12) greeting = "Mornin' sunshine";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  const recentMoodLog = user.moodLogs && user.moodLogs.length > 0 ? user.moodLogs[0] : null;
  const userName = user.name || "Bestie"; // Fallback user name

  // --- Specific Condition Nudges ---
  if (recentMoodLog?.mood === "Stressed" && user.hormoneLevels?.cortisol > 70) {
    const nudges = [
      `Feeling that pressure, ${userName}? Your cortisol's a bit up there. A quick 2-min breathing exercise could be clutch. You got this! 🧘`,
      `${userName}, noticed you're stressed and cortisol is high. How about a short walk to clear your head? Even 5 mins helps! 🚶‍♀️`,
    ];
    return `${greeting}! ${nudges[Math.floor(Math.random() * nudges.length)]}`;
  }

  if (recentMoodLog?.mood === "Tired" && user.hormoneLevels?.dopamine < 35) {
    const nudges = [
      `Feelin' a bit drained, ${userName}? Low dopamine vibes. Maybe your fave jam or a quick stretch could spark some energy? 🎶💃`,
      `${userName}, if you're tired and dopamine is low, a small win can help! What's one tiny thing you can do for a boost? ✨`,
    ];
    return `${greeting}! ${nudges[Math.floor(Math.random() * nudges.length)]}`;
  }
  
  // --- Incomplete Task Nudges ---
  if (incompleteTask) {
    const taskNudges = [
      `That task "${incompleteTask.name}" is lookin' at you... 👀 Finish it and feel that W!`,
      `Psst, ${userName}! "${incompleteTask.name}" is waiting. Smash that quest & grab those VibePoints! 🚀`,
      `Just a little nudge for "${incompleteTask.name}". You're closer than you think! You got this! 💪`,
    ];
    return `${greeting}! ${taskNudges[Math.floor(Math.random() * taskNudges.length)]}`;
  }

  // --- Recent Mood Nudges ---
  if (recentMoodLog) {
    switch (recentMoodLog.mood) {
      case "Happy":
        const happyNudges = [
          `Yasss, ${userName}! Keep that happy energy flowing! What's one good thing you can do to keep the vibe high? ✨`,
          `So glad you're feeling happy, ${userName}! Ride that wave and spread the good vibes! 😊`,
        ];
        return `${greeting}! ${happyNudges[Math.floor(Math.random() * happyNudges.length)]}`;
      case "Sad":
        const sadNudges = [
          `Sending you some good energy, ${userName}. It's okay to feel sad. Maybe some comfort music or a chat with a friend? 🎧`,
          `Hey ${userName}, if you're feeling sad, remember to be kind to yourself. Small comforts can make a big difference. 💖`,
        ];
        return `${greeting}. ${sadNudges[Math.floor(Math.random() * sadNudges.length)]}`;
      case "Energetic":
        const energeticNudges = [
          `Feelin' that energy, ${userName}? Channel it into something awesome! What's your power move today? ⚡`,
          `Amazing energy, ${userName}! Let's make the most of it. Got any goals you wanna crush? 🎯`,
        ];
        return `${greeting}! ${energeticNudges[Math.floor(Math.random() * energeticNudges.length)]}`;
      case "Calm":
        const calmNudges = [
          `Loving that calm vibe, ${userName}. Perfect time for some mindfulness or just enjoying the peace. 🧘‍♂️`,
          `Glad you're feeling calm, ${userName}. Soak it in! What's helping you stay chill today? 🍃`,
        ];
        return `${greeting}, ${calmNudges[Math.floor(Math.random() * calmNudges.length)]}`;
      case "Anxious":
         const anxiousNudges = [
            `Hey ${userName}, if anxiety's creeping in, remember to breathe. A few deep breaths can make a difference. You're not alone. ❤️`,
            `Feeling anxious, ${userName}? Try to focus on something grounding. What's one thing you can see, hear, or touch right now?`,
        ];
        return `${greeting}. ${anxiousNudges[Math.floor(Math.random() * anxiousNudges.length)]}`;
      case "Tired":
         const tiredNudges = [
            `If you're feeling tired, ${userName}, listen to your body. A short rest or an early night could be what you need. 😴`,
            `Running on low battery, ${userName}? Don't forget to recharge. Gentle stretches or some quiet time might help.`,
        ];
        return `${greeting}. ${tiredNudges[Math.floor(Math.random() * tiredNudges.length)]}`;
    }
  }

  // --- Streak Nudges ---
  if (user.streak > 0) {
    const streakNudges = [
      `Your ${user.streak}-day streak is fire, ${userName}! 🔥 Keep it lit!`,
      `Day ${user.streak} of being awesome! Let's keep the streak alive, ${userName}! You're crushing it. 🏆`,
    ];
    return `${greeting}! ${streakNudges[Math.floor(Math.random() * streakNudges.length)]}`;
  }

  // --- Base Nudges (Fallback) ---
  const baseNudges = [
    `What's the vibe today, ${userName}? Let's make it a good one!`,
    `Ready to slay, ${userName}? ✨ Let's get this bread!`,
    `Keep that main character energy going, ${userName}! You're the moment. 🌟`,
    `Remember to hydrate, bestie! That H2O glow is real. 💧`,
    `${userName}, you're doing amazing, sweetie! Keep it up! 💅`,
    `Just checking in, ${userName}! Hope you're having a good day. If not, it's okay, tomorrow's a new vibe!`,
  ];
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
