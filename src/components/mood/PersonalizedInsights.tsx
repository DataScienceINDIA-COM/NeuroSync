"use client";

import { useState } from "react";
import type { MoodLog } from "@/types/mood";
import { getPersonalizedInsights, type PersonalizedInsightsOutput, type PersonalizedInsightsInput } from "@/ai/flows/personalized-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Lightbulb, AlertTriangle } from "lucide-react"; // AlertTriangle for error
import { useToast } from "@/hooks/use-toast";

interface PersonalizedInsightsProps {
  moodLogs: MoodLog[];
}

export function PersonalizedInsights({ moodLogs }: PersonalizedInsightsProps) {
  const [insights, setInsights] = useState<PersonalizedInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGetInsights = async () => {
    if (moodLogs.length < 3) { 
      toast({
        title: "Spill More Tea! ☕", // GenZ
        description: "Log a few more vibes so the AI can really get your energy. Bet.", // GenZ
        variant: "default", 
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setInsights(null);

    try {
      const formattedLogs = moodLogs.map(log => ({
        ...log,
        activities: Array.isArray(log.activities) ? log.activities : (typeof log.activities === 'string' ? log.activities.split(',').map(s => s.trim()) : []),
      })) as PersonalizedInsightsInput['moodLogs'];

      const result = await getPersonalizedInsights({ moodLogs: formattedLogs });
      setInsights(result);
      if (result.insights.length === 0) {
        toast({
          title: "AI's Still Processing The Vibes... 🤔", // GenZ
          description: "AI's still thinking... or maybe your vibes are too unique! Keep logging, bestie!", // GenZ
        });
      }
    } catch (e) {
      console.error("Error fetching personalized insights:", e);
      setError("Oof, AI had a main character moment. Try again in a bit, fam?"); // GenZ
      toast({
        title: "Major Glitch Alert! 😱", // GenZ
        description: "Couldn't get your vibe report. That's a bit sus. Maybe try again?", // GenZ
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-accent" />
          AI Vibe Report
        </CardTitle>
        <CardDescription>
          AI's got the tea on your feels. Get tips to level up your mood game. No cap. {/* GenZ */}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[150px] flex flex-col justify-center">
        {error && (
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertTitle>Error, big yikes! 😬</AlertTitle> {/* GenZ */}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent mb-3" />
            <p className="text-sm font-medium">AI's cookin' up your vibe report... 🍳</p> {/* GenZ */}
            <p className="text-xs text-muted-foreground">Hold tight, this is gonna be fire! 🔥</p> {/* GenZ */}
          </div>
        )}

        {!isLoading && !insights && !error && (
          <div className="text-center text-muted-foreground py-6">
            <Lightbulb className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Ready for some AI wisdom? Spill it!</p> {/* GenZ */}
            <p className="text-sm">Hit the button to get your personalized vibe check! Let's gooo!</p> {/* GenZ */}
            {moodLogs.length < 3 && <p className="text-xs mt-2">Log at least 3 vibes for the best tea, bestie!</p>} {/* GenZ */}
          </div>
        )}
        
        {insights && insights.insights.length > 0 && (
          <div className="space-y-3">
            {insights.insights.map((insight, index) => (
              <Card key={index} className="bg-background/70 border-border/50 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-md flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    AI Deet & Pro-Tip ✨
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm pb-4">
                  <p><strong className="font-medium">The Tea:</strong> {insight.insight}</p>
                  <p><strong className="font-medium">Level Up:</strong> {insight.tip}</p>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground pt-0 pb-3">
                  <p>Relevance: {Math.round(insight.relevanceScore * 100)}% (Low key accurate, right?)</p> {/* GenZ */}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {!isLoading && insights && insights.insights.length === 0 && !error && (
           <div className="text-center text-muted-foreground py-6">
            <Lightbulb className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No specific tea from the AI rn.</p> {/* GenZ */}
            <p className="text-sm">Keep logging those vibes for more personalized deets! You got this!</p> {/* GenZ */}
          </div>
        )}

      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGetInsights} 
          disabled={isLoading || moodLogs.length < 1} 
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Spill the AI Tea 🍵 {/* GenZ */}
        </Button>
      </CardFooter>
    </Card>
  );
}
