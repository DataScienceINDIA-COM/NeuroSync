
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarClock, ListChecks, Sparkles as SparklesIcon, TrendingUp } from 'lucide-react';

interface OnboardingDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

const onboardingSteps = [
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

export function OnboardingDialog({ isOpen, onComplete }: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = onboardingSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="sm:max-w-[480px] bg-card border-primary/30 shadow-2xl rounded-xl">
        <DialogHeader className="text-center pt-6">
          {step.icon}
          <DialogTitle className="text-2xl font-extrabold text-primary drop-shadow-md">{step.title}</DialogTitle>
          <DialogDescription className="text-md text-muted-foreground pt-2 px-4">
            {step.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center items-center my-6">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-6 rounded-full mx-1 transition-all duration-300 ${
                index === currentStep ? 'bg-accent w-8' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 px-6 pb-6">
          <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10">
            Skip Tutorial
          </Button>
          <Button onClick={handleNext} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
            {step.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
