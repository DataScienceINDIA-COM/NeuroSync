import type { Task } from "@/types/task";
import type { User } from "@/types/user";
import { useState, useEffect } from 'react';

// Helper hook to manage client-side random selection
function useClientSideRandom<T>(items: T[]): T | null {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  useEffect(() => {
    if (items.length > 0) {
      const randomIndex = Math.floor(Math.random() * items.length);
      setSelectedItem(items[randomIndex]);
    } else {
      setSelectedItem(null);
    }
  }, [items]); // Re-run if items array changes, though typically it won't in this usage

  return selectedItem;
}


function getAICoachNudge(user: User | null, task: Task | null): string {
  const generalNudges = [
    "You're totally slaying it! ✨",
    "Keep that main character energy! 💅",
    "Low key, you're crushing this. Period.",
    "No cap, every step counts! 💯",
    "Manifesting those good vibes! 🔮",
    "Let's get this bread (focus)! 🍞",
    "Big Ws incoming! 🚀",
    "It's giving... productivity! 💅",
    "You're the GOAT! 🐐",
    "This is your sign to keep going! 😉",
  ];

  if (!user || !task) {
    const randomIndex = Math.floor(Math.random() * generalNudges.length);
    return generalNudges[randomIndex];
  }

  const taskName = task.name;
  const userName = user.name;
  const nudges = [
    `Yo ${userName}, you're almost there with ${taskName}! Keep vibin'! 🎶`,
    `Push through, ${userName}! ${taskName} is basically donezo. ✅`,
    `Stay focused, fam! ${userName}, you're making big moves on ${taskName}! 📈`,
    `Don't dip, ${userName}! ${taskName} is nearly in the bag! 💰`,
    `Remember the goal, ${userName}! That ${taskName} progress is fire! 🔥`,
    `${userName}, you're absolutely bodying ${taskName}! Let's gooo! 💥`,
    `OK, ${userName}, you're popping off on ${taskName}! We love to see it! 🤩`,
  ];

  const randomIndex = Math.floor(Math.random() * nudges.length);
  return nudges[randomIndex];
}

function getAICoachMessage(user: User | null, task: Task | null): string {
  if (!user) {
    return "Heyyy! Ready to check the vibes today? Let's get it! ✨";
  }
    
  const userName = user.name;
  if(!task){
    return `Wassup ${userName}! How's the energy? Lmk if I can help! Peep the quests, maybe? 🤔`;
  }

  const taskName = task.name;
  
  return `Ayy ${userName}! Mad props for grinding on ${taskName}. Keep that positive energy flowin'! You're doing amazing, sweetie. 💖`;
}

export { getAICoachMessage, getAICoachNudge, useClientSideRandom };
