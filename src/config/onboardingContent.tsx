"use client"; // Keep client directive if icons are complex components needing client context, though generally config can be server.
// For simple JSX like Lucide icons, this should be fine.

import { CalendarClock, ListChecks, Sparkles as SparklesIcon, TrendingUp } from 'lucide-react';
import type { ReactElement } from 'react';

export interface OnboardingStep {
  title: string;
  icon: ReactElement;
  description: string;
  buttonText: string;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    title: "Yo, Welcome to Vibe Check! 🎉",
    icon: <SparklesIcon className="h-12 w-12 text-accent mx-auto mb-4" data-ai-hint="celebration confetti" />,
    description: "Ready to level up your wellness game? We're here to help you track your vibes, smash quests, and catch those W's. Let's get this bread! 🍞",
    buttonText: "Leggo! 👉",
  },
  {
    title: "Daily Vibe Check-In 📝",
    icon: <CalendarClock className="h-12 w-12 text-primary mx-auto mb-4" data-ai-hint="calendar clock" />,
    description: "How you feelin' today? Log your mood daily. It's like a quick selfie for your feels. No cap, it helps you see patterns and what makes you tick. ✨",
    buttonText: "Got It, Fam! 👍",
  },
  {
    title: "Quests & VibePoints (VP) 🎯💰",
    icon: <ListChecks className="h-12 w-12 text-green-500 mx-auto mb-4" data-ai-hint="checklist tasks"/>,
    description: "Complete daily 'Quests' – small W's that boost your mood and earn you VibePoints (VP). Use VP to snag cool rewards. It's giving... main character energy! 👑",
    buttonText: "Let's Vibe! 🚀",
  },
  {
    title: "AI-Powered Insights 🧠✨",
    icon: <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-4" data-ai-hint="analytics graph" />,
    description: "Our AI homies analyze your vibes and suggest personalized content, tasks, and even avatar looks! Get ready for some next-level support. 🤖",
    buttonText: "I'm Ready to Glow Up! 🔥"
  }
];
