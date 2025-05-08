import { Task } from "@/types/task";
import { User } from "@/types/user";

function getAICoachNudge(user: User | null, task: Task | null): string {
  if (!user || !task) {
    const generalNudges = [
      "You've got this!",
      "Keep up the great work!",
      "Stay focused on your goals!",
      "Every step counts!",
    ];
    const randomIndex = Math.floor(Math.random() * generalNudges.length);
    return generalNudges[randomIndex];
  }

  const taskName = task.name;
  const userName = user.name;
  const nudges = [
    `You're doing great, ${userName}! You are close to completing ${taskName}!`,
    `Keep pushing forward, ${userName}! ${taskName} is within reach!`,
    `Stay focused, ${userName}! You're making excellent progress on ${taskName}!`,
    `Don't give up, ${userName}! You're almost done with ${taskName}!`,
    `Remember your goals, ${userName}! Keep up the fantastic work on ${taskName}!`,
  ];

  const randomIndex = Math.floor(Math.random() * nudges.length);
  return nudges[randomIndex];
}

function getAICoachMessage(user: User | null, task: Task | null): string {
  if (!user) {
    return "Hello there! Ready to take on the day?";
  }
    
  const userName = user.name;
  if(!task){
    return `Hello ${userName}! How can i help you?`;
  }

  const taskName = task.name;
  

  return `Hey ${userName}! Great job on working on ${taskName}. Keep up the great work and focus on your progress!`;
}

export { getAICoachMessage, getAICoachNudge };