"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { CommunityPost } from "@/types/community"; // Changed from Community
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import CommunityService from "./CommunityService"; // Assuming CommunityService is correctly implemented
import { generateId } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Users } from "lucide-react";
import { format, parseISO } from "date-fns";


export function CommunityDisplay() {
  const [newPostContent, setNewPostContent] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [communityService, setCommunityService] = useState<CommunityService | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Instantiate CommunityService only on the client-side
    setCommunityService(new CommunityService());
  }, []);

  useEffect(() => {
    if (communityService) {
      const fetchPosts = () => {
        const fetchedPosts = communityService.getPosts();
        // Sort posts by timestamp, newest first. parseISO is crucial here.
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
        userName: "Current User", // Replace with actual user name from context/auth
        message: newPostContent,
        timestamp: new Date().toISOString(),
      };
      communityService.createPost(newPost);
      // Optimistically update UI and re-sort
      setPosts((prevPosts) => [newPost, ...prevPosts].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
      setNewPostContent("");
    }
  };
  
  if (!isClient) {
    // Return a loading skeleton or null during SSR/SSG
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-accent"/>Community Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">Loading community feed...</p>
        </CardContent>
      </Card>
    );
  }
  // It's possible communityService is still null briefly after isClient is true
  if (!communityService) {
     return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-accent"/>Community Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">Initializing community service...</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-accent"/>Community Hub</CardTitle>
          <CardDescription>Connect with others by sharing your thoughts, experiences, or asking questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePostSubmit} className="space-y-3">
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share something with the community..."
              className="w-full min-h-[100px] bg-background/70 focus:bg-background"
              required
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={!newPostContent.trim()}>
              <Send className="mr-2 h-4 w-4" /> Share Post
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>See what others are sharing.</CardDescription>
        </CardHeader>
        <CardContent>
        {posts.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id} className="bg-card/80 p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-primary-foreground">{post.userName}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(post.timestamp), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap text-sm">{post.message}</p>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        ) : (
            <p className="text-muted-foreground text-center py-10">No posts yet. Be the first to share something!</p>
        )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CommunityDisplay;
