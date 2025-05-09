
"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { CommunityPost } from "@/types/community";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import CommunityService from "@/components/community/CommunityService";
import { generateId } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Send, Users, MessageSquarePlus, Sparkles, Trophy, Loader2, Lightbulb } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { useMoodLogs } from "@/contexts/MoodLogsContext";;
import { generateCommunityChallenges, type Challenge, type GenerateCommunityChallengesOutput } from "@/ai/flows/community-challenges-flow";
import { useToast } from "@/hooks/use-toast";


export function CommunityDisplay() {
  const { user } = useUser();
  const { moodLogs } = useMoodLogs();
  const { toast } = useToast();

  const [newPostContent, setNewPostContent] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [communityService, setCommunityService] = useState<CommunityService | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
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

  const fetchAndSetChallenge = async () => {
    if (!user || moodLogs.length === 0) {
      // console.log("User or mood logs not available for challenge generation.");
      return;
    }
    setIsLoadingChallenge(true);
    try {
      // Get the most recent 3-5 mood logs for better context
      const recentMoods = moodLogs.slice(0, 5).map(log => ({ date: log.date, mood: log.mood }));
      
      if (recentMoods.length === 0) {
        // Fallback if there are somehow no recent moods despite moodLogs having length
        setCurrentChallenge({ title: "Share Your Vibe!", description: "What's making you feel something today? Share it with the squad!", category: "connection" });
        setIsLoadingChallenge(false);
        return;
      }

      const challengeOutput: GenerateCommunityChallengesOutput = await generateCommunityChallenges({ recentMoods });
      if (challengeOutput.challenges && challengeOutput.challenges.length > 0) {
        // Pick a random challenge from the suggestions or the first one
        setCurrentChallenge(challengeOutput.challenges[Math.floor(Math.random() * challengeOutput.challenges.length)]);
      } else {
         setCurrentChallenge({ title: "Vibe Check Challenge!", description: "How are you vibin' today? Share a quick update with everyone!", category: "connection" });
      }
    } catch (error) {
      console.error("Failed to fetch community challenge:", error);
      toast({
        title: "Challenge Glitch! 😬",
        description: "Couldn't fetch a new vibe challenge. Try again later, maybe?",
        variant: "destructive",
      });
      // Set a default/fallback challenge
      setCurrentChallenge({ title: "Kindness Quest!", description: "Do something nice for someone (or yourself!) today. Let us know how it went!", category: "positivity" });
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  useEffect(() => {
    if(isClient && user && moodLogs.length > 0){
      fetchAndSetChallenge();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, user, moodLogs.length]); // Re-fetch if moodLogs count changes significantly (e.g. new log added)


  const handlePostSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (newPostContent.trim() && communityService && user) {
      const newPostData: CommunityPost = {
          id: generateId(),
          likes: 0,
          comments: [],
          shares: 0,
          likedBy: [],
          commentCount: 0,
          shareCount: 0,
          edited: false,
          deleted: false,
          userId: user.id,
        userName: user.name || "Vibe Explorer", 
        userAvatar: user.avatar?.imageUrl,
        message: newPostContent,
        timestamp: new Date().toISOString(),
      };
      communityService.createPost(newPostData);
      setPosts((prevPosts) => [newPostData, ...prevPosts].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
      setNewPostContent("");
      toast({ title: "Vibe Posted! 🎤✨", description: "Your thoughts are out there, fam!"});
    }
  };
  

  const handleLikePost = async (postId: string) => {
    try {
        if (!user || !communityService) return;
        const updatedPosts = await communityService.likePost(postId, user.id);
        setPosts(updatedPosts);
    } catch (error) {
        console.error("Error liking post:", error);
         toast({
            title: "Failed to like post",
            description: "There was a problem liking the post. Please try again.",
            variant: "destructive",
          });
    }
};

const handleCommentPost = async (postId: string, commentText: string) => {
    try {
        if (!user || !communityService || !commentText) return;

        const updatedPosts = await communityService.commentPost(postId, {
            id: generateId(),
            userId: user.id,
            userName: user.name || "Vibe Explorer",
            userAvatar: user.avatar?.imageUrl,
            comment: commentText,
            timestamp: new Date().toISOString(),
        });
        setPosts(updatedPosts);
    } catch (error) {
        console.error("Error commenting on post:", error);
         toast({
            title: "Failed to comment",
            description: "There was a problem commenting on the post. Please try again.",
            variant: "destructive",
          });
    }
};


const handleDeletePost = async (postId: string) => {
    try {
        await communityService?.deletePost(postId);
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
        console.error("Error deleting post:", error);
    }
};
  

  const handleChallengePost = () => {
    if (currentChallenge && user) {
      const challengePostContent = `Accepted the challenge: "${currentChallenge.title}"! 🎉\n\n${currentChallenge.description}`;
      setNewPostContent(challengePostContent);
      // Potentially auto-focus the textarea here
      document.getElementById('community-post-textarea')?.focus();
       toast({ title: `Challenge Accepted! 🏆`, description: `"${currentChallenge.title}" added to your post. Share your progress!`});
    }
  };


  if (!isClient) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-accent"/>The Squad Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">Loading squad chat... Hold your horses, fam! 🐎</p> 
        </CardContent>
      </Card>
    );
  }
  
  if (!communityService) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-accent"/>The Squad Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">Setting up the squad zone... It's gonna be lit! 🔥</p> 
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       {/* AI Vibe Challenge Card */}
      <Card className="shadow-lg bg-gradient-to-br from-primary/20 to-accent/20 border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-foreground drop-shadow-sm">
            <Trophy className="h-7 w-7 text-yellow-400" />
            Today's Vibe Challenge! 🏆
          </CardTitle>
          {currentChallenge && <CardDescription className="text-primary-foreground/80">{currentChallenge.category} Challenge</CardDescription>}
        </CardHeader>
        <CardContent className="text-center">
          {isLoadingChallenge ? (
            <div className="flex flex-col items-center justify-center h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="mt-2 text-sm text-muted-foreground">AI is cookin' up a challenge...</p>
            </div>
          ) : currentChallenge ? (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">{currentChallenge.title}</h3>
              <p className="text-sm text-muted-foreground">{currentChallenge.description}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[100px]">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No challenge loaded. Log some vibes to get one!</p>
            </div>
          )}
        </CardContent>
        {currentChallenge && !isLoadingChallenge && (
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={handleChallengePost} variant="default" className="shadow-md hover:shadow-lg active:shadow-inner">
              <Sparkles className="mr-2 h-4 w-4" /> Accept & Share Vibe!
            </Button>
             <Button onClick={fetchAndSetChallenge} variant="outline" size="sm" className="bg-background/70 hover:bg-background">
              <Sparkles className="mr-2 h-4 w-4 text-accent" /> Get New Challenge
            </Button>
          </CardFooter>
        )}
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquarePlus className="h-6 w-6 text-accent"/>Drop a Vibe in the Squad Zone 🎤</CardTitle> 
          <CardDescription>Share your feels, ask Qs, connect with the crew. Keep it 💯, no cap.</CardDescription> 
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <Textarea
              id="community-post-textarea"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind, fam? Spill the tea... 🍵" 
              className="w-full min-h-[120px] bg-background/70 focus:bg-background rounded-lg shadow-inner"
              required
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={!newPostContent.trim()}>
              <Send className="mr-2 h-4 w-4" /> Post It, Period.💅 
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Fresh Drops from the Tribe 📢</CardTitle> 
          <CardDescription>See what other Vibe Checkers are saying. It's giving... community. ✨</CardDescription> 
        </CardHeader>
        <CardContent>
        {posts.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id} className="bg-card/90 p-4 shadow-md hover:shadow-lg transition-shadow rounded-xl border-border/70 relative">
                            <div className="flex items-start gap-3 mb-2">
                                {post.userAvatar ? (
                                     <img src={post.userAvatar} alt={`${post.userName}'s avatar`} data-ai-hint="user avatar" className="h-10 w-10 rounded-full object-cover border-2 border-primary/50"/>
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                        <Users className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-primary-foreground">{post.userName}</h4>
                                        <p className="text-xs text-muted-foreground">
                                        {format(parseISO(post.timestamp), "MMM d, yy 'at' h:mma")}
                                        </p>
                                    </div>
                                    <p className="text-foreground whitespace-pre-wrap text-sm">{post.message}</p>
                                </div>
                            </div>
                               {/* Buttons row */}
                                <div className="flex items-center justify-end space-x-2 mt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleLikePost(post.id)}
                                    >
                                        Like {post.likedBy?.length > 0 ? `(${post.likedBy.length})` : ""}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const commentText = prompt("Enter your comment:");
                                            if (commentText !== null && commentText.trim() !== "") {
                                                handleCommentPost(post.id, commentText.trim());
                                            }
                                        }}
                                    >
                                        Comment {post.comments?.length > 0 ? `(${post.comments.length})` : ""}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {}}
                                    >
                                        Share {post.shareCount > 0 ? `(${post.shareCount})` : ""}
                                    </Button>
                                    {user?.id === post.userId && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    // Handle edit post logic here
                                                    // For example, you might open a modal to edit the post
                                                     toast({
                                                        title: "Not Implemented!",
                                                        description: "The edit function is still in development",
                                                        variant: "warning",
                                                        });
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id)}>
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                </div>
                               

                        </Card>
                    ))}
                </div>
            </ScrollArea>
        ) : (
            <p className="text-muted-foreground text-center py-10">It's quiet in here... too quiet. Be the first to drop a vibe! Bet. 😉</p> 
        )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CommunityDisplay;
