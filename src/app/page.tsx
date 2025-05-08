"use client";

import { useEffect, useState, useMemo } from "react";
import type { MoodLog } from "@/types/mood";
import { Header } from "@/components/Header";
import { MoodLogForm } from "@/components/mood/MoodLogForm";
import { MoodChart } from "@/components/mood/MoodChart";
import { PersonalizedInsights } from "@/components/mood/PersonalizedInsights";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import TaskService from "@/components/task/TaskService";
import type { Task } from "@/types/task";
import type { Hormone } from "@/types/hormone";
import type { Reward } from "@/types/reward";
import RewardDisplay from "@/components/rewards/RewardDisplay";
import CommunityDisplay from "@/components/community/CommunityDisplay";
import { getAICoachNudge, useClientSideRandom } from "@/ai/coach";
import ContentDisplay from "@/components/content/ContentDisplay";
import type { User } from "@/types/user";
import AvatarDisplay from "@/components/avatar/Avatar";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit3, Brain, Zap, CheckCircle2, Gift, Users, BookOpen, Info, Wand2, ImagePlus, Loader2, Sparkles, Bell } from "lucide-react";
import { generateAvatar } from "@/ai/flows/generate-avatar-flow";
import { useToast } from "@/hooks/use-toast";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { MoodLogsProvider, useMoodLogs } from "@/contexts/MoodLogsContext";
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase-messaging';
import { storeUserFCMToken, sendNotificationToUser } from '@/actions/fcm-actions';


const LOCAL_STORAGE_KEY_TASKS = "vibeCheckTasks";
const LOCAL_STORAGE_KEY_REWARDS = "vibeCheckRewards";
const LOCAL_STORAGE_KEY_NEUROPOINTS = "vibeCheckNeuroPoints";


function HomePageContent() {
  const { moodLogs, handleLogMood: contextHandleLogMood, setMoodLogs: contextSetMoodLogs } = useMoodLogs();
  const { user, setUser } = useUser(); 

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  
  const taskService = useMemo(() => {
    if (!isClient || !user) return null; 
    const userWithMoodLogs = { ...user, moodLogs: moodLogs || [] };
    return new TaskService(userWithMoodLogs);
  }, [user, moodLogs, isClient]);

  const [tasks, setTasks] = useState<Task[]>(() => {
     if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
      if (storedTasks) {
        try {
          return JSON.parse(storedTasks);
        } catch (e) {
          console.error("Failed to parse tasks from localStorage", e);
          return [];
        }
      }
    }
    return [];
  });

  const incompleteTasks = useMemo(() => tasks.filter(t => !t.isCompleted), [tasks]);
  const randomIncompleteTask = useClientSideRandom(incompleteTasks);
  
  const nudge = useMemo(() => {
    if (!isClient || !user) return "Loading...";
    return getAICoachNudge(user, randomIncompleteTask ?? null);
  }, [user, randomIncompleteTask, isClient]);


  const [neuroPoints, setNeuroPoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedPoints = localStorage.getItem(LOCAL_STORAGE_KEY_NEUROPOINTS);
      if (storedPoints) {
        try {
          return JSON.parse(storedPoints);
        } catch (e) {
          console.error("Failed to parse neuro points from localStorage", e);
          return 0;
        }
      }
    }
    return 0;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    if (typeof window !== 'undefined') {
      const storedRewards = localStorage.getItem(LOCAL_STORAGE_KEY_REWARDS);
      if (storedRewards) {
        try {
          return JSON.parse(storedRewards);
        } catch (e) {
          console.error("Failed to parse rewards from localStorage", e);
        }
      }
    }
    return [
      { id: generateId(), name: "15 Min Guided Chill Sesh", description: "Unlock a new meditation track. Issa vibe.", pointsRequired: 50, isUnlocked: false, type: "virtual" },
      { id: generateId(), name: "Affirmation Pack Drop", description: "Get a fresh pack of positive affirmations. You got this!", pointsRequired: 100, isUnlocked: false, type: "virtual" },
      { id: generateId(), name: "Stress-Less eBook", description: "Cop a free eBook on managing the bad vibes.", pointsRequired: 200, isUnlocked: false, type: "real-world" },
    ];
  });

  const [avatarDescription, setAvatarDescription] = useState<string>("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if ('Notification' in window && user && setUser) {
      requestNotificationPermission().then(async token => {
        if (token) {
          console.log("FCM Token:", token);
          const result = await storeUserFCMToken(user.id, token);
          if (result.success) {
            setUser(prevUser => prevUser ? ({ ...prevUser, fcmToken: token }) : null);
            toast({ title: "Notifications Enabled! 🔔", description: "You'll get cool updates now. Low-key excited!" });
          } else {
             toast({ title: "Uh Oh! 😥", description: `Failed to save notification settings: ${result.message}. Try again later, fam.`, variant: "destructive"});
          }
        } else {
          console.log("Permission not granted for notifications or no token received.");
           toast({ title: "No Stress! 😎", description: "Notifications are off. You can change this in browser settings anytime, no cap.", variant: "default"});
        }
      });

      // Listen for foreground messages
      const unsubscribe = onMessageListener().then(payload => {
        console.log('Received foreground message: ', payload);
        toast({
          title: payload.notification?.title || "New Vibe!",
          description: payload.notification?.body || "Something cool happened!",
        });
      }).catch(err => console.error('Failed to listen for foreground messages: ', err));
      
      // Cleanup listener on unmount
      return () => {
        unsubscribe.then(fn => fn()).catch(err => console.error('Error unsubscribing from FCM: ', err));
      };
    }
  }, [isClient, user, setUser, toast]);


  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasks));
      localStorage.setItem(LOCAL_STORAGE_KEY_REWARDS, JSON.stringify(rewards));
      localStorage.setItem(LOCAL_STORAGE_KEY_NEUROPOINTS, JSON.stringify(neuroPoints));
    }
  }, [tasks, rewards, neuroPoints, isClient]);

  useEffect(() => {
    if (isClient && tasks.length === 0 && taskService && user) {
      const initializeTasks = async () => {
        const defaultTaskData: Omit<Task, 'id' | 'isCompleted'>[] = [
          { name: "10 min Zen Time", description: "Quick mindfulness meditation. Slay.", rewardPoints: 10, hasNeuroBoost: true },
          { name: "30 min Move Sesh", description: "Get that body movin'. No cap.", rewardPoints: 20, hasNeuroBoost: false },
          { name: "Read for 20", description: "Expand the mind grapes. Big brain energy.", rewardPoints: 15, hasNeuroBoost: false },
          { name: "Catch 8hrs Zzz's", description: "Good sleep is a W. Bet.", rewardPoints: 20, hasNeuroBoost: false },
          { name: "Journal Dump (10m)", description: "Spill the tea in your journal. Period.", rewardPoints: 10, hasNeuroBoost: true },
        ];
        
        const newTasks = await Promise.all(defaultTaskData.map(async (taskData) => {
          if(!taskService || !user) return null; 
          const currentUserMood = moodLogs?.[0]?.mood || "Neutral"; 
          const rewardPoints = await taskService.calculateRewardPointsForTask(taskData.description, currentUserMood, user.hormoneLevels);
          return taskService.createTask({...taskData, rewardPoints});
        }));
        setTasks(newTasks.filter(Boolean) as Task[]);
      };
      initializeTasks();
    }
  }, [isClient, taskService, user, moodLogs]); 


  const handleTaskCompletion = (taskId: string) => {
    if (!taskService || !user || !setUser) return; 
    const taskToComplete = tasks.find(t => t.id === taskId);
    if (!taskToComplete || taskToComplete.isCompleted) return;

    const updatedTask = taskService.updateTask(taskId, { isCompleted: true });
    if (updatedTask) {
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
      setNeuroPoints(prevPoints => prevPoints + (updatedTask.rewardPoints * (updatedTask.hasNeuroBoost ? 10 : 1)));
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          completedTasks: [...prevUser.completedTasks, updatedTask],
          streak: taskService.user.streak 
        }
      });

      // Send notification on task completion
      if (user.fcmToken) {
        sendNotificationToUser(user.id, {
          title: "Quest Smashed! 🚀",
          body: `You just crushed '${updatedTask.name}'! Keep that W energy!`,
          data: { taskId: updatedTask.id }
        }).then(response => {
          if (response.success) {
            console.log("Task completion notification sent!");
          } else {
            console.error("Failed to send task completion notification:", response.message);
          }
        });
      }
    }
  };
  
  const handleClaimReward = (rewardId: string) => {
    if (!user || !setUser) return;
    const rewardToClaim = rewards.find(r => r.id === rewardId);
    if (rewardToClaim && !rewardToClaim.isUnlocked && neuroPoints >= rewardToClaim.pointsRequired) {
      setNeuroPoints(prev => prev - rewardToClaim.pointsRequired);
      setRewards(prevRewards => prevRewards.map(r => r.id === rewardId ? {...r, isUnlocked: true} : r));
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          claimedRewards: [...prevUser.claimedRewards, {...rewardToClaim, isUnlocked: true}]
        }
      });
    }
  };

  const handleGenerateAvatar = async () => {
    if (!user || !setUser) return;
    if (avatarDescription.trim().length < 10) {
      toast({
        title: "Yo, Hold Up! 🧐",
        description: "Your avatar prompt needs a bit more spice! At least 10 chars, fam.",
        variant: "destructive",
      });
      return;
    }
    if (avatarDescription.trim().length > 200) {
      toast({
        title: "Easy There, Shakespeare! 😅",
        description: "Keep that prompt under 200 chars. Short 'n sweet!",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAvatar(true);
    try {
      const result = await generateAvatar({ description: avatarDescription });
      setUser(prevUser => {
        if(!prevUser) return null;
        return {
          ...prevUser,
          avatar: {
            ...(prevUser.avatar || { id: generateId(), name: 'New Avatar', description: '', imageUrl: '' }), 
            imageUrl: result.imageUrl,
            description: `AI-generated: ${avatarDescription}`, 
          }
        }
      });
      toast({
        title: "Avatar Leveled Up! ✨🚀",
        description: "Your new AI-generated vibe is live! Looking fresh!",
      });
      setAvatarDescription(""); 
    } catch (error: any) {
      console.error("Avatar generation failed:", error);
      toast({
        title: "AI Brain Fart! 🧠💨",
        description: error.message || "Couldn't generate your avatar. Try a different prompt or give it a sec!",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const existingDates = moodLogs.map((log) => log.date);

  useEffect(() => {
     const fetchTaskSuggestions = async () => {
      if (isClient && taskService && user && moodLogs && moodLogs.length > 0) { 
        const suggestedTaskDetails = await taskService.getSuggestedTasks(moodLogs); 
        if (suggestedTaskDetails) {
          const newTasksPromises = suggestedTaskDetails.map(async (taskDetail) => {
            if(!taskService || !user) return null;
            const currentUserMood = moodLogs?.[0]?.mood || "Neutral";
            const rewardPoints = await taskService.calculateRewardPointsForTask(taskDetail.description, currentUserMood, user.hormoneLevels);
            return taskService.createTask({ 
              name: taskDetail.name,
              description: taskDetail.description,
              hasNeuroBoost: taskDetail.hasNeuroBoost,
              rewardPoints: rewardPoints,
            });
          });
          const newTasks = (await Promise.all(newTasksPromises)).filter(Boolean) as Task[];
          setTasks(prevTasks => {
            const existingTaskNames = new Set(prevTasks.map(t => t.name));
            const uniqueNewTasks = newTasks.filter(nt => !existingTaskNames.has(nt.name));
            return [...prevTasks, ...uniqueNewTasks];
          });
        }
      }
    };
    
    if (tasks.length <= 5 && moodLogs && moodLogs.length > 0) { 
       fetchTaskSuggestions();
    }
  }, [isClient, taskService, user, moodLogs, tasks.length]); 

  const handleSendTestNotification = async () => {
    if (!user || !user.fcmToken) {
      toast({
        title: "Can't Send Push! 🚧",
        description: "Enable notifications or check your settings, bestie.",
        variant: "destructive",
      });
      return;
    }
    setIsSendingNotification(true);
    const result = await sendNotificationToUser(user.id, {
      title: "Vibe Check Test! 🧪",
      body: `Yo ${user.name}, this is a test notification! It's giving... works! 🎉`,
      data: { test: "true" }
    });
    setIsSendingNotification(false);
    if (result.success) {
      toast({ title: "Test Notification Sent! 📬", description: "Check your device, it should pop off!" });
    } else {
      toast({ title: "Push Fail! 😭", description: `Couldn't send test notification: ${result.message}`, variant: "destructive" });
    }
  };

  if (!isClient || !user) { 
    return (
      <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="text-lg ml-4 text-accent font-semibold">Loading your epic vibes... ✨</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <section className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Glow Up</CardTitle> 
                <Button variant="ghost" size="icon" onClick={() => alert("Profile edit finna drop!")}><Edit3 className="h-4 w-4"/></Button> 
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3">
                <AvatarDisplay avatar={user.avatar} size={100}/>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">Streak: {user.streak} days <Zap className="inline h-4 w-4 text-yellow-400 fill-yellow-400" /></p>
                 <p className="text-lg font-bold text-accent">VibePoints: {neuroPoints} VP</p>
                {nudge && <p className="text-xs text-center p-3 bg-accent/10 rounded-lg text-accent-foreground shadow-sm">{nudge}</p>}
                {user.fcmToken && (
                  <Button onClick={handleSendTestNotification} disabled={isSendingNotification} variant="outline" size="sm" className="mt-2">
                    {isSendingNotification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                    {isSendingNotification ? "Sending..." : "Test Push"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="h-6 w-6 text-primary" />
                  AI Avatar Studio ✨
                </CardTitle>
                <CardDescription>
                  Craft a unique avatar with AI! Describe your vision below. Keep it cool, keep it clean. 😉
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., 'a neon-lit cyberpunk fox with headphones', 'a serene cosmic jellyfish floating in a nebula', 'a retro pixel art robot chilling on a cloud'"
                  value={avatarDescription}
                  onChange={(e) => setAvatarDescription(e.target.value)}
                  maxLength={200}
                  className="min-h-[100px] focus:bg-background"
                  disabled={isGeneratingAvatar}
                />
                <Button
                  onClick={handleGenerateAvatar}
                  disabled={isGeneratingAvatar || avatarDescription.trim().length < 10 || avatarDescription.trim().length > 200}
                  className="w-full"
                >
                  {isGeneratingAvatar ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingAvatar ? "AI Makin' Magic..." : "Generate My Vibe!"}
                </Button>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Daily Vibe Check</CardTitle> 
                <CardDescription>What's the tea? Spill it.</CardDescription> 
              </CardHeader>
              <CardContent>
                <MoodLogForm onLogMood={contextHandleLogMood} existingDates={existingDates} />
              </CardContent>
            </Card>
            
            <PersonalizedInsights moodLogs={moodLogs} />
          </section>

          <section className="lg:col-span-2 space-y-6">
            <MoodChart moodLogs={moodLogs} />
            
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary"/>Brain Juice Levels</CardTitle>
                <CardDescription>Peep what your brain's cookin' up, bestie.</CardDescription> 
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><Sparkles className="inline h-4 w-4 mr-1 text-blue-500" />Dopamine: <span className="font-semibold">{user.hormoneLevels.dopamine}%</span></div>
                <div><Zap className="inline h-4 w-4 mr-1 text-red-500" />Adrenaline: <span className="font-semibold">{user.hormoneLevels.adrenaline}%</span></div>
                <div><Info className="inline h-4 w-4 mr-1 text-orange-500" />Cortisol: <span className="font-semibold">{user.hormoneLevels.cortisol}%</span></div>
                <div><Sparkles className="inline h-4 w-4 mr-1 text-green-500" />Serotonin: <span className="font-semibold">{user.hormoneLevels.serotonin}%</span></div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary"/>Today's Quests</CardTitle>
                 <CardDescription>Small W's = Big Vibe Energy. Get those VibePoints!</CardDescription> 
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className={`p-4 border rounded-xl flex justify-between items-center transition-all ${task.isCompleted ? "bg-muted opacity-60 shadow-inner" : "bg-card hover:shadow-md"}`}>
                      <div>
                        <h4 className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : "text-card-foreground"}`}>{task.name}</h4>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                        <p className="text-xs mt-1">
                          Reward: <span className="font-semibold text-accent">{task.rewardPoints} VP</span>
                          {task.hasNeuroBoost && <span className="ml-1 text-xs text-yellow-500 font-semibold">(<Brain className="inline h-3 w-3"/> x10 Vibe Boost!)</span>}
                        </p>
                      </div>
                      {!task.isCompleted && (
                        <Button onClick={() => handleTaskCompletion(task.id)} size="sm" variant="default">
                          GG! 
                        </Button>
                      )}
                    </div>
                  ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">No quests today, fam. AI is cookin' some up, or add your own!</p> 
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Vibe Archive</CardTitle>
                <CardDescription>Your mood history? It's giving ✨receipts✨.</CardDescription> 
              </CardHeader>
              <CardContent>
                {moodLogs.length > 0 ? (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {moodLogs.map((log) => (
                        <Card key={log.id} className="p-4 bg-card/90 hover:shadow-lg transition-shadow rounded-xl border-border/70">
                          <h3 className="font-semibold text-md text-primary-foreground">
                            {format(parseISO(log.date), "EEEE, MMM d, yyyy")}
                          </h3>
                          <p className="text-sm text-foreground">
                            <strong className="font-medium">Vibe:</strong> {log.mood}
                          </p>
                          {log.activities.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              <strong>Activities:</strong> {log.activities.join(", ")}
                            </p>
                          )}
                          {log.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              <strong>Extra Tea:</strong> {log.notes}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    No vibes logged yet, bruh. Start tracking to see your archive! 
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
        
        <section className="lg:col-span-3 space-y-6">
           <RewardDisplay rewards={rewards} neuroPoints={neuroPoints} onClaimReward={handleClaimReward} />
        </section>
        <section className="lg:col-span-3 space-y-6">
           <CommunityDisplay />
        </section>
        <section className="lg:col-span-3 space-y-6">
           <ContentDisplay />
        </section>
      </main>
      <footer className="text-center p-6 border-t border-border/50 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Vibe Check. Keep it 💯. ✌️</p> 
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <UserProvider>
      <MoodLogsProvider>
        <HomePageContent />
      </MoodLogsProvider>
    </UserProvider>
  );
}

    