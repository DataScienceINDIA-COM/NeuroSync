
"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { CommunityPost } from "@/types/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import CommunityService from "@/components/community/CommunityService"; // Corrected import path
import { generateId } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Users, MessageSquarePlus } from "lucide-react";
import { format, parseISO } from "date-fns";


export function CommunityDisplay() {
  const [newPostContent, setNewPostContent] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [communityService, setCommunityService] = useState<CommunityService | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Conditional instantiation of CommunityService
    if (typeof window !== "undefined") { // This ensures CommunityService is only created client-side
        setCommunityService(new CommunityService());
    }
  }, []);

  useEffect(() => {
    if (communityService) {
      const fetchPosts = () => {
        const fetchedPosts = communityService.getPosts();
        setPosts(fetchedPosts.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
      };
      fetchPosts();
    }
  }, [communityService]);

  const handlePostSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (newPostContent.trim() && communityService) {
      const newPost: CommunityPost = {
        id: generateId(),
        userName: "Vibe Checker Pro", // GenZ vibe
        message: newPostContent,
        timestamp: new Date().toISOString(),
      };
      communityService.createPost(newPost);
      setPosts((prevPosts) => [newPost, ...prevPosts].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
      setNewPostContent("");
    }
  };

  if (!isClient) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-accent"/>The Squad Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">Loading squad chat... Hold your horses, fam!</p> {/* GenZ vibe */}
        </CardContent>
      </Card>
    );
  }
  
  if (!communityService) { // This block is for when isClient is true, but service hasn't been set up by useEffect yet
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-accent"/>The Squad Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">Setting up the squad zone... It's gonna be lit! 🔥</p> {/* GenZ vibe */}
        </CardContent>
      </Card>
    );
  }

  const mainContent = (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquarePlus className="h-6 w-6 text-accent"/>Drop a Vibe in the Squad Zone 🎤</CardTitle> {/* GenZ vibe */}
          <CardDescription>Share your feels, ask Qs, connect with the crew. Keep it 💯, no cap.</CardDescription> {/* GenZ vibe */}
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind, fam? Spill the tea... 🍵" // GenZ vibe
              className="w-full min-h-[120px] bg-background/70 focus:bg-background rounded-lg shadow-inner"
              required
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={!newPostContent.trim()}>
              <Send className="mr-2 h-4 w-4" /> Post It, Period.💅 {/* GenZ vibe */}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Fresh Drops from the Tribe 📢</CardTitle> {/* GenZ vibe */}
          <CardDescription>See what other Vibe Checkers are saying. It's giving... community. ✨</CardDescription> {/* GenZ vibe */}
        </CardHeader>
        <CardContent>
        {posts.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id} className="bg-card/90 p-4 shadow-md hover:shadow-lg transition-shadow rounded-xl border-border/70">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-primary-foreground">{post.userName}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(post.timestamp), "MMM d, yy 'at' h:mma")}
                                </p>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap text-sm">{post.message}</p>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        ) : (
            <p className="text-muted-foreground text-center py-10">It's quiet in here... too quiet. Be the first to drop a vibe! Bet. 😉</p> {/* GenZ vibe */}
        )}
        </CardContent>
      </Card>
    </div>
  );

  return mainContent;
}

export default CommunityDisplay;
