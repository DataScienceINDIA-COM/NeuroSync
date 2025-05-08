"use client";

import { useEffect, useState } from "react";
import type { Content } from "@/types/content";
import { Button } from "@/components/ui/button";
import ContentService from "@/components/content/ContentService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, PlayCircle, ExternalLink } from "lucide-react";

export default function ContentDisplay() {
  const [contentList, setContentList] = useState<Content[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [contentService, setContentService] = useState<ContentService | null>(null);

  useEffect(() => {
    setIsClient(true);
    setContentService(new ContentService());
  }, []);

  useEffect(() => {
    if (contentService) {
      setContentList(contentService.getContent());
    }
  }, [contentService]);

  if (!isClient || !contentService) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-accent" />
            Content Drops 🎬
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">Loading fresh content picks... It's gonna be a vibe! ✨</p> {/* GenZ vibe */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-accent" />
           Curated Content Drops 💅
        </CardTitle>
        <CardDescription>Handpicked vids, reads, and listens to boost your vibe. Low key, it's fire. 🔥</CardDescription> {/* GenZ vibe */}
      </CardHeader>
      <CardContent className="space-y-4">
      {contentList.length === 0 ? (
         <p className="text-muted-foreground text-center py-10">Nothin' new here yet, fam. Peep back later for some fire content! Bet. 😉</p> /* GenZ vibe */
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentList.map((content) => (
            <Card key={content.id} className="p-4 rounded-xl shadow-md bg-card/90 hover:shadow-lg transition-shadow border-border/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {content.type === 'video' && <PlayCircle className="h-5 w-5 text-primary"/>}
                  {content.type === 'article' && <BookOpen className="h-5 w-5 text-primary"/>}
                  {content.type === 'podcast' && <PlayCircle className="h-5 w-5 text-primary"/> /* Could use Headphones icon */}
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
              >
                Check it Out, Bestie! <ExternalLink className="ml-1 h-4 w-4"/> {/* GenZ vibe */}
              </Button>
            </Card>
          ))}
        </div>
      )}
      </CardContent>
    </Card>
  );
}
