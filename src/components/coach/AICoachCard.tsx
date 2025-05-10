"use client";

import type { User } from "@/types/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb } from "lucide-react"; // Using Lightbulb for prompts/tips
import { AICoachProfile } from "@/config/agentProfiles";

interface AICoachCardProps {
  user: User;
  nudge: string; // This 'nudge' will be treated as the personalized prompt
}

export function AICoachCard({ user, nudge }: AICoachCardProps) {
  const coachName = AICoachProfile.name;
  const coachAvatarUrl = AICoachProfile.avatarImageUrl;
  const nameParts = coachName.split(' ');
  const fallbackInitials = nameParts.length > 0 && nameParts[0].length >=2
    ? nameParts[0].substring(0, 2).toUpperCase()
    : "AI";

  return (
    <Card 
      className="shadow-lg border-accent/30 rounded-xl overflow-hidden bg-gradient-to-tr from-primary/5 via-card to-accent/5 group hover:shadow-xl transition-shadow duration-300" 
      aria-labelledby="coach-card-title"
    >
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-accent group-hover:scale-105 transition-transform duration-200">
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
            <CardTitle id="coach-card-title" className="text-lg font-bold text-primary drop-shadow-sm group-hover:text-accent transition-colors duration-200">
              {coachName}'s Hot Tip! 🔥
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground italic">
              Your daily dose of inspo! ✨
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="bg-primary/10 p-3.5 rounded-lg border border-primary/20 shadow-inner flex items-start gap-2.5">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-foreground leading-relaxed">
            {nudge || "Keep shining, superstar! You got this. 🌟"}
          </p>
        </div>
        {/* 
          Future Enhancement: Conditionally render an action button based on prompt content.
          For example, if a prompt suggests logging mood:
          {nudge && nudge.toLowerCase().includes("log your mood") && (
            <Button variant="outline" size="sm" className="mt-3 w-full border-primary/40 text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors">
              Log My Vibe Now! 📝
            </Button>
          )}
        */}
      </CardContent>
    </Card>
  );
}