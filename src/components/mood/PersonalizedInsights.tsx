"use client";

import { useState } from "react";
import type { MoodLog } from "@/types/mood";
import { getPersonalizedInsights, type PersonalizedInsightsOutput, type PersonalizedInsightsInput } from "@/ai/flows/personalized-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Lightbulb } from "lucide-react";
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
    if (moodLogs.length === 0) {
      toast({
        title: "Not enough data",
        description: "Please log your mood before requesting insights.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setInsights(null);

    try {
      // Ensure moodLogs match the AI input schema, especially activities as string[]
      const formattedLogs = moodLogs.map(log => ({
        ...log,
        activities: Array.isArray(log.activities) ? log.activities : (typeof log.activities === 'string' ? log.activities.split(',').map(s => s.trim()) : []),
      })) as PersonalizedInsightsInput['moodLogs'];

      const result = await getPersonalizedInsights({ moodLogs: formattedLogs });
      setInsights(result);
    } catch (e) {
      console.error("Error fetching personalized insights:", e);
      setError("Failed to fetch insights. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to fetch insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-accent" />
          Personalized Insights
        </CardTitle>
        <CardDescription>
          Discover tips and patterns based on your mood logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="ml-2">Generating your insights...</p>
          </div>
        )}

        {!isLoading && !insights && !error && (
          <div className="text-center text-muted-foreground py-6">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Click the button below to generate insights based on your mood history.</p>
            {moodLogs.length === 0 && <p className="text-sm mt-1">Log your mood first to enable insights.</p>}
          </div>
        )}
        
        {insights && insights.insights.length > 0 && (
          <div className="space-y-4">
            {insights.insights.map((insight, index) => (
              <Card key={index} className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Insight & Tip
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong className="font-medium">Insight:</strong> {insight.insight}</p>
                  <p><strong className="font-medium">Actionable Tip:</strong> {insight.tip}</p>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Relevance Score: {Math.round(insight.relevanceScore * 100)}%
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {!isLoading && insights && insights.insights.length === 0 && (
           <div className="text-center text-muted-foreground py-6">
            <p>No specific insights generated at this time. Keep logging for more personalized tips!</p>
          </div>
        )}

      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGetInsights} 
          disabled={isLoading || moodLogs.length === 0}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate Insights
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper icon (not part of lucide-react, so defined inline or use a substitute)
const AlertCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
