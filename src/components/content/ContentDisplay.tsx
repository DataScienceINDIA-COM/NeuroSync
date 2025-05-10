
"use client";

import { useEffect, useState } from "react";
import type { Content } from "@/types/content";
import { Button } from "@/components/ui/button";
import ContentService from "./ContentService"; // Corrected import path
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, PlayCircle, ExternalLink, Loader2 } from "lucide-react";
import { getRecommendedContent } from "@/ai/flows/recommended-content"; 
import type { RecommendedContentOutput } from "@/ai/flows/recommended-content"; 
import { useUser } from "@/contexts/UserContext"; 
import { useMoodLogs } from "@/contexts/MoodLogsContext"; 


export default function ContentDisplay() {
  const [contentList, setContentList] = useState<Content[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [contentService, setContentService] = useState<ContentService | null>(null);
  const [recommendedContent, setRecommendedContent] = useState<RecommendedContentOutput | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const { user } = useUser(); 
  const { moodLogs } = useMoodLogs(); 

  useEffect(() => {
    setIsClient(true);
    const service = new ContentService();
    setContentService(service);
    setContentList(service.getContent());
  }, []);

  
  useEffect(() => {
    if (isClient && user && moodLogs && moodLogs.length > 0 && contentService) { 
      const fetchRecommendedContent = async () => {
        setIsLoadingRecommendations(true);
        try {
          const result = await getRecommendedContent({
            moodLogs: moodLogs,
            // Ensure hormoneLevels and tasks exist on user object, provide defaults if not
            hormoneLevels: user.hormoneLevels || { dopamine: 50, adrenaline: 50, cortisol: 50, serotonin: 50 },
            activities: user.tasks?.map(task => task.name) || [], 
          });
          setRecommendedContent(result);
        } catch (error) {
          console.error("Failed to get recommended content:", error);
          // Fallback: pick a few random items from the full list
          if (contentService) {
            const allContent = contentService.getContent();
            const shuffled = allContent.sort(() => 0.5 - Math.random());
            setRecommendedContent({ recommendations: shuffled.slice(0, Math.min(2, shuffled.length)).map(c => c.title) });
          } else {
            setRecommendedContent({ recommendations: ["10-Minute Guided Meditation for Stress Relief"] });
          }
        } finally {
          setIsLoadingRecommendations(false);
        }
      };
      fetchRecommendedContent();
    } else if (isClient && contentService) {
      // If no user/mood data, show a few random items from all content
      const allContent = contentService.getContent();
      const shuffled = allContent.sort(() => 0.5 - Math.random());
      setRecommendedContent({ recommendations: shuffled.slice(0, Math.min(3, shuffled.length)).map(c => c.title) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, user, moodLogs, contentService]); 

  if (!isClient || !contentService) {
    return (
      <Card className="shadow-lg" aria-labelledby="content-loading-title">
        <CardHeader>
          <CardTitle id="content-loading-title" className="flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-accent" aria-hidden="true" />
            Content Drops 🎬
          </CardTitle>
        </CardHeader>
        <CardContent role="alert" aria-busy="true">
          <p className="text-muted-foreground text-center py-10">Loading fresh content picks... It's gonna be a vibe! ✨</p> 
        </CardContent>
      </Card>
    );
  }

  
  const itemsToDisplay = isLoadingRecommendations 
    ? [] // Show nothing or a loader while actively fetching AI recommendations
    : recommendedContent?.recommendations && recommendedContent.recommendations.length > 0
      ? contentList.filter(content => recommendedContent.recommendations.includes(content.title))
      : contentList.slice(0,3); // Fallback to showing first 3 if no recommendations yet

  return (
    <Card className="shadow-lg" aria-labelledby="content-title">
      <CardHeader>
        <CardTitle id="content-title" className="flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-accent" aria-hidden="true" />
           Curated Content Drops 💅
        </CardTitle>
        <CardDescription>Handpicked vids, reads, and listens to boost your vibe. Low key, it's fire. 🔥</CardDescription> 
      </CardHeader>
      <CardContent>
      {isLoadingRecommendations ? (
        <div className="flex flex-col items-center justify-center h-[200px]">
            <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" aria-hidden="true" />
            <p className="text-muted-foreground">AI is curating your vibes...</p>
        </div>
      ) : itemsToDisplay.length === 0 ? (
         <p className="text-muted-foreground text-center py-10">Nothin' new here yet, fam. Peep back later for some fire content! Bet. 😉</p> 
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="List of curated content">
          {itemsToDisplay.map((content) => (
            <li key={content.id}>
              <Card className="p-4 rounded-xl shadow-md bg-card/90 hover:shadow-lg transition-shadow border-border/70 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {content.type === 'video' && <PlayCircle className="h-5 w-5 text-primary" aria-hidden="true"/>}
                    {content.type === 'article' && <BookOpen className="h-5 w-5 text-primary" aria-hidden="true"/>}
                    {content.type === 'podcast' && <PlayCircle className="h-5 w-5 text-primary" aria-hidden="true"/>}
                    <h3 className="font-semibold text-lg text-primary-foreground">{content.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize mb-1">{content.type}</p>
                  <p className="text-foreground text-sm mt-1 mb-2">{content.description}</p>
                  {content.hormones && content.hormones.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Good for: <span className="font-medium capitalize">{content.hormones.join(', ')}</span>
                    </p>
                  )}
                </div>
                <Button 
                  variant="link" 
                  className="mt-3 p-0 h-auto text-accent hover:text-accent/80 self-start" 
                  onClick={() => window.open(content.url, "_blank")}
                  aria-label={`Open content: ${content.title} in a new tab`}
                >
                  Check it Out, Bestie! <ExternalLink className="ml-1 h-4 w-4" aria-hidden="true"/> 
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
      </CardContent>
    </Card>
  );
}

