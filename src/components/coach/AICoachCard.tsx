
"use client";

import type { User } from "@/types/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Sparkles } from "lucide-react";
import { AICoachProfile } from "@/config/agentProfiles"; // Import the agent profile

interface AICoachCardProps {
  user: User; // User prop might be used for personalization later
  nudge: string;
}

export function AICoachCard({ user, nudge }: AICoachCardProps) {
  const coachName = AICoachProfile.name;
  const coachAvatarUrl = AICoachProfile.avatarImageUrl;
  // Get first two letters of the first name for fallback, or 'AI'
  const nameParts = coachName.split(' ');
  const fallbackInitials = nameParts.length > 0 && nameParts[0].length >=2 
    ? nameParts[0].substring(0, 2).toUpperCase() 
    : "AI";


  return (
    <Card className="shadow-lg border-accent/50 rounded-xl overflow-hidden bg-gradient-to-tr from-accent/10 to-primary/10" aria-labelledby="coach-card-title">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-accent">
            {coachAvatarUrl ? (
              <AvatarImage src={coachAvatarUrl} alt={`${coachName} avatar`} data-ai-hint="friendly robot" />
            ) : (
              <AvatarImage src={`https://picsum.photos/seed/aibot/100/100`} alt={`${coachName} placeholder avatar`} data-ai-hint="robot face" /> 
            )}
            <AvatarFallback className="bg-accent text-accent-foreground">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle id="coach-card-title" className="text-lg font-bold text-accent drop-shadow-sm">
              {coachName} Says...
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground italic">
              A little inspo to keep you glowin'! ✨
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground leading-relaxed">
          {nudge || "Keep shining, superstar! You got this. 🌟"}
        </p>
        {/* Future: Add quick actions like "Noted!" or "Need more help?" */}
      </CardContent>
    </Card>
  );
}
