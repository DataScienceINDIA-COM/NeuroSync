
"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { CommunityPost } from "@/types/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import CommunityService from "@/components/community/CommunityService"; 
import { generateId } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Send, Users, MessageSquarePlus, Sparkles, Trophy, Loader2, Lightbulb, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { useMoodLogs } from "@/contexts/MoodLogsContext";
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
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
        setCommunityService(new CommunityService());
    }
  }, []);

  useEffect(() => {
    if (communityService) {
      const fetchPosts = () => {
        // Pass true if admin to see all posts, otherwise only approved/pending
        const fetchedPosts = communityService.getPosts(user?.id === 'admin'); // Example admin check
        setPosts(fetchedPosts);
      };
      fetchPosts();
    }
  }, [communityService, user?.id]);

  const fetchAndSetChallenge = async () => {
    if (!user || moodLogs.length === 0) {
      return;
    }
    setIsLoadingChallenge(true);
    try {
      const recentMoods = moodLogs.slice(0, 5).map(log => ({ date: log.date, mood: log.mood }));
      
      if (recentMoods.length === 0) {
        setCurrentChallenge({ title: "Share Your Vibe!", description: "What's making you feel something today? Share it with the squad!", category: "connection" });
        setIsLoadingChallenge(false);
        return;
      }

      const challengeOutput: GenerateCommunityChallengesOutput = await generateCommunityChallenges({ recentMoods });
      if (challengeOutput.challenges && challengeOutput.challenges.length > 0) {
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
  }, [isClient, user?.id, moodLogs.length]);


  const handlePostSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPostContent.trim() && communityService && user) {
      setIsSubmittingPost(true);
      try {
        const newPostData = await communityService.createPost({
            id: generateId(), // ID will be set by service, but good to have one client-side for optimistic updates if needed
            userId: user.id,
            userName: user.name || "Vibe Explorer", 
            userAvatar: user.avatar?.imageUrl,
            message: newPostContent,
            timestamp: new Date().toISOString(),
        });
        // Only add if createPost doesn't throw (i.e., post is approved or pending)
        setPosts((prevPosts) => [newPostData, ...prevPosts].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
        setNewPostContent("");
        toast({ title: "Vibe Posted! 🎤✨", description: "Your thoughts are out there, fam!"});
      } catch (error: any) {
        console.error("Error creating post:", error);
        toast({
          title: "Post Failed! 😥",
          description: error.message || "Could not submit your post. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmittingPost(false);
      }
    }
  };
  

  const handleLikePost = async (postId: string) => {
    try {
        if (!user || !communityService) return;
        const updatedPost = await communityService.likePost(postId, user.id);
        if (updatedPost) {
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? updatedPost : p).sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
        }
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
        if (!user || !communityService || !commentText.trim()) return;

        const updatedPost = await communityService.addCommentToPost(postId, {
            userId: user.id,
            userName: user.name || "Vibe Explorer",
            userAvatar: user.avatar?.imageUrl,
            comment: commentText.trim(),
            timestamp: new Date().toISOString(),
        });
        if (updatedPost) {
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? updatedPost : p).sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
        }
    } catch (error: any) {
        console.error("Error commenting on post:", error);
         toast({
            title: "Comment Failed 😥",
            description: error.message || "There was a problem commenting. Please try again.",
            variant: "destructive",
          });
    }
};


const handleDeletePost = async (postId: string) => {
    try {
        if (!user || !communityService) return;
        const postToDelete = posts.find(p => p.id === postId);
        if (postToDelete?.userId !== user.id) {
            toast({ title: "Not Your Post!", description: "You can only delete your own vibes, fam.", variant: "destructive"});
            return;
        }
        await communityService.deletePost(postId);
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId).sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
        toast({ title: "Vibe Deleted!", description: "That post is history now."});
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ title: "Deletion Failed", description: "Couldn't delete the post. Try again?", variant: "destructive"});
    }
};
  

  const handleChallengePost = () => {
    if (currentChallenge && user) {
      const challengePostContent = `Accepted the challenge: "${currentChallenge.title}"! 🎉\n\n${currentChallenge.description}`;
      setNewPostContent(challengePostContent);
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
              disabled={!user || user.id.startsWith('guest_') || isSubmittingPost}
            />
             {user && user.id.startsWith('guest_') && <p className="text-xs text-muted-foreground">Sign in to post in the Squad Zone!</p>}
            <Button type="submit" className="w-full sm:w-auto" disabled={!newPostContent.trim() || !user || user.id.startsWith('guest_') || isSubmittingPost}>
              {isSubmittingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmittingPost ? "Posting..." : "Post It, Period.💅"}
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
                        <Card key={post.id} className={`p-4 shadow-md hover:shadow-lg transition-shadow rounded-xl border-border/70 relative ${post.status === 'rejected' ? 'bg-red-500/10 border-red-500/50' : 'bg-card/90'}`}>
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
                                    {post.status === 'rejected' ? (
                                      <div className="p-2 my-1 bg-destructive/20 rounded-md text-sm">
                                        <p className="text-destructive font-semibold flex items-center"><ShieldAlert className="h-4 w-4 mr-1.5"/> This post was hidden.</p>
                                        {post.moderationReason && <p className="text-xs text-destructive/80 italic">Reason: {post.moderationReason}</p>}
                                      </div>
                                    ) : (
                                      <p className="text-foreground whitespace-pre-wrap text-sm">{post.message}</p>
                                    )}
                                </div>
                            </div>
                               { post.status === 'approved' && (
                                 <div className="flex items-center justify-end space-x-2 mt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => user && !user.id.startsWith('guest_') ? handleLikePost(post.id) : toast({title: "Guests Can't Like!", description:"Sign in to spread the love!", variant: "destructive"})}
                                        disabled={!user || user.id.startsWith('guest_')}
                                    >
                                        Like {post.likes > 0 ? `(${post.likes})` : ""}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (!user || user.id.startsWith('guest_')) {
                                                toast({title: "Guests Can't Comment!", description:"Sign in to join the convo!", variant: "destructive"});
                                                return;
                                            }
                                            const commentText = prompt("Enter your comment:");
                                            if (commentText !== null && commentText.trim() !== "") {
                                                handleCommentPost(post.id, commentText); // Pass trimmed in service
                                            }
                                        }}
                                        disabled={!user || user.id.startsWith('guest_')}
                                    >
                                        Comment {post.comments?.length > 0 ? `(${post.comments.length})` : ""}
                                    </Button>
                                   
                                    {user?.id === post.userId && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                     toast({
                                                        title: "Coming Soon™️",
                                                        description: "Editing posts is on the roadmap, bestie!",
                                                        variant: "default",
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
                               )}
                               {post.status === 'pending_moderation' && (
                                <div className="p-2 my-1 bg-yellow-500/10 rounded-md text-sm text-yellow-700 flex items-center">
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin"/> Waiting for Vibe Check...
                                </div>
                               )}
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
