"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// Removed direct icon imports as they are now part of onboardingSteps data structure
import { onboardingSteps } from '@/config/onboardingContent.tsx'; // Import steps from config

interface OnboardingDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

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
          {/* Icon is now directly rendered from the step object */}
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
              aria-hidden="true" // Decorative element
            />
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 px-6 pb-6">
          {currentStep < onboardingSteps.length -1 && ( // Show skip only if not the last step
             <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10">
                Skip Tutorial
             </Button>
          )}
          <Button 
            onClick={handleNext} 
            className={`w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all ${currentStep === onboardingSteps.length -1 ? 'sm:ml-auto' : '' }`}
            aria-label={step.buttonText}
          >
            {step.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
