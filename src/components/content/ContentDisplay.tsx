"use client";

import { useEffect, useState } from "react";
import type { Content } from "@/types/content";
import { Button } from "@/components/ui/button";
import ContentService from "./ContentService"; // Assuming ContentService is correctly implemented
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function ContentDisplay() {
  const [contentList, setContentList] = useState<Content[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // ContentService might rely on localStorage or other client-side things,
  // so it's better to instantiate it after client-side mount.
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            Recommended Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading content...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent" />
           Recommended Content
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
      {contentList.length === 0 ? (
         <p className="text-muted-foreground text-center py-6">No content available at the moment. Check back later!</p>
      ) : (
        contentList.map((content) => (
          <div key={content.id} className="p-4 border rounded-lg shadow-sm bg-card/80 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-primary-foreground">{content.title}</h3>
            <p className="text-sm text-muted-foreground capitalize">{content.type}</p>
            <p className="text-foreground mt-1">{content.description}</p>
            {content.hormones && content.hormones.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Targets: <span className="font-medium">{content.hormones.join(', ')}</span>
              </p>
            )}
            <Button 
              variant="link" 
              className="mt-2 p-0 h-auto text-accent hover:text-accent/80" 
              onClick={() => window.open(content.url, "_blank")}
            >
              Access Content
            </Button>
          </div>
        ))
      )}
      </CardContent>
    </Card>
  );
}
