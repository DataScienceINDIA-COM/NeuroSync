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
import { getRandomHormone, predictHormone } from "@/ai/hormone-prediction";
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
import { Edit3, Brain, Zap, CheckCircle2, Gift, Users, BookOpen, Info, Wand2, ImagePlus, Loader2 } from "lucide-react";
import { generateAvatar } from "@/ai/flows/generate-avatar-flow";
import { useToast } from "@/hooks/use-toast";


const LOCAL_STORAGE_KEY_MOOD = "vibeCheckLogs";
const LOCAL_STORAGE_KEY_TASKS = "vibeCheckTasks";
const LOCAL_STORAGE_KEY_USER = "vibeCheckUser";
const LOCAL_STORAGE_KEY_REWARDS = "vibeCheckRewards";
const LOCAL_STORAGE_KEY_NEUROPOINTS = "vibeCheckNeuroPoints";


export default function HomePage() {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  
  const [user, setUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (storedUser) return JSON.parse(storedUser);
    }
    return {
      id: generateId(),
      name: "Vibe Lord", 
      completedTasks: [],
      claimedRewards: [],
      inProgressTasks: [],
      hormoneLevels: getRandomHormone(),
      avatar: {
        id: generateId(),
        name: "Avatar",
        description: "User's Default Avatar",
        imageUrl: `https://picsum.photos/seed/${generateId()}/100/100`,
      },
      streak: 0,
    };
  });

  const taskService = useMemo(() => {
    if (!isClient) return null;
    return new TaskService(user);
  }, [user, isClient]);

  const [tasks, setTasks] = useState<Task[]>(() => {
     if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
      if (storedTasks) return JSON.parse(storedTasks);
    }
    return [];
  });

  const incompleteTasks = useMemo(() => tasks.filter(t => !t.isCompleted), [tasks]);
  const randomIncompleteTask = useClientSideRandom(incompleteTasks);
  const nudge = useMemo(() => {
    if (!isClient) return "Loading...";
    return getAICoachNudge(user, randomIncompleteTask ?? null);
  }, [user, randomIncompleteTask, isClient]);


  const [neuroPoints, setNeuroPoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedPoints = localStorage.getItem(LOCAL_STORAGE_KEY_NEUROPOINTS);
      if (storedPoints) return JSON.parse(storedPoints);
    }
    return 0;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    if (typeof window !== 'undefined') {
      const storedRewards = localStorage.getItem(LOCAL_STORAGE_KEY_REWARDS);
      if (storedRewards) return JSON.parse(storedRewards);
    }
    return [
      { id: generateId(), name: "15 Min Guided Chill Sesh", description: "Unlock a new meditation track. Issa vibe.", pointsRequired: 50, isUnlocked: false, type: "virtual" },
      { id: generateId(), name: "Affirmation Pack Drop", description: "Get a fresh pack of positive affirmations. You got this!", pointsRequired: 100, isUnlocked: false, type: "virtual" },
      { id: generateId(), name: "Stress-Less eBook", description: "Cop a free eBook on managing the bad vibes.", pointsRequired: 200, isUnlocked: false, type: "real-world" },
    ];
  });

  // AI Avatar Generation State
  const [avatarDescription, setAvatarDescription] = useState<string>("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    const storedMoodLogs = localStorage.getItem(LOCAL_STORAGE_KEY_MOOD);
    if (storedMoodLogs) {
      try {
        const parsedLogs = JSON.parse(storedMoodLogs) as MoodLog[];
        setMoodLogs(
          parsedLogs.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
        );
      } catch (error) {
        console.error("Failed to parse mood logs from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY_MOOD);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY_MOOD, JSON.stringify(moodLogs));
      localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasks));
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(LOCAL_STORAGE_KEY_REWARDS, JSON.stringify(rewards));
      localStorage.setItem(LOCAL_STORAGE_KEY_NEUROPOINTS, JSON.stringify(neuroPoints));
    }
  }, [moodLogs, tasks, user, rewards, neuroPoints, isClient]);

  useEffect(() => {
    if (isClient && tasks.length === 0 && taskService) {
      const defaultTasks: Omit<Task, "id" | "isCompleted">[] = [
        { name: "10 min Zen Time", description: "Quick mindfulness meditation. Slay.", rewardPoints: 10, hasNeuroBoost: true},
        { name: "30 min Move Sesh", description: "Get that body movin'. No cap.", rewardPoints: 20, hasNeuroBoost: false},
        { name: "Read for 20", description: "Expand the mind grapes. Big brain energy.", rewardPoints: 15, hasNeuroBoost: false},
        { name: "Catch 8hrs Zzz's", description: "Good sleep is a W. Bet.", rewardPoints: 20, hasNeuroBoost: false},
        { name: "Journal Dump (10m)", description: "Spill the tea in your journal. Period.", rewardPoints: 10, hasNeuroBoost: true},
      ];
      const newTasks = defaultTasks.map(taskData => taskService.createTask(taskData));
      setTasks(newTasks);
    }
  }, [isClient, taskService]);

  useEffect(() => {
    if (isClient) {
      setUser(prevUser => ({ ...prevUser, hormoneLevels: predictHormone(prevUser) }));
    }
  }, [tasks, isClient]);

  const handleLogMood = (newLog: MoodLog) => {
    setMoodLogs((prevLogs) =>
      [newLog, ...prevLogs].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    );
  };
  
  const handleTaskCompletion = (taskId: string) => {
    if (!taskService) return;
    const taskToComplete = tasks.find(t => t.id === taskId);
    if (!taskToComplete || taskToComplete.isCompleted) return;

    const updatedTask = taskService.updateTask(taskId, { isCompleted: true });
    if (updatedTask) {
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
      setNeuroPoints(prevPoints => prevPoints + (updatedTask.rewardPoints * (updatedTask.hasNeuroBoost ? 10 : 1)));
      setUser(prevUser => ({
        ...prevUser,
        completedTasks: [...prevUser.completedTasks, updatedTask],
        streak: taskService.user.streak 
      }));
    }
  };
  
  const handleClaimReward = (rewardId: string) => {
    const rewardToClaim = rewards.find(r => r.id === rewardId);
    if (rewardToClaim && !rewardToClaim.isUnlocked && neuroPoints >= rewardToClaim.pointsRequired) {
      setNeuroPoints(prev => prev - rewardToClaim.pointsRequired);
      setRewards(prevRewards => prevRewards.map(r => r.id === rewardId ? {...r, isUnlocked: true} : r));
      setUser(prevUser => ({
        ...prevUser,
        claimedRewards: [...prevUser.claimedRewards, {...rewardToClaim, isUnlocked: true}]
      }));
    }
  };

  const handleGenerateAvatar = async () => {
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
      setUser(prevUser => ({
        ...prevUser,
        avatar: {
          ...prevUser.avatar,
          imageUrl: result.imageUrl,
          description: `AI-generated: ${avatarDescription}`, 
        }
      }));
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

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
        <p className="text-lg animate-pulse text-accent font-semibold">Loading your epic vibes... ✨</p>
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
                <MoodLogForm onLogMood={handleLogMood} existingDates={existingDates} />
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
                <div><Info className="inline h-4 w-4 mr-1 text-blue-500" />Dopamine: <span className="font-semibold">{user.hormoneLevels.dopamine}%</span></div>
                <div><Zap className="inline h-4 w-4 mr-1 text-red-500" />Adrenaline: <span className="font-semibold">{user.hormoneLevels.adrenaline}%</span></div>
                <div><Info className="inline h-4 w-4 mr-1 text-orange-500" />Cortisol: <span className="font-semibold">{user.hormoneLevels.cortisol}%</span></div>
                <div><Info className="inline h-4 w-4 mr-1 text-green-500" />Serotonin: <span className="font-semibold">{user.hormoneLevels.serotonin}%</span></div>
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
                  <p className="text-muted-foreground text-center py-6">No quests today, fam. Add some to pop off!</p> 
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
