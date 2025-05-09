
"use client";

import { useEffect, useState, useMemo } from "react";
import type { MoodLog } from "@/types/mood";
import { Header } from "@/components/Header";
import { MoodLogForm } from "@/components/mood/MoodLogForm";
import { MoodChart } from "@/components/mood/MoodChart";
import { PersonalizedInsights } from "@/components/mood/PersonalizedInsights";
import CommunityDisplay from "@/components/community/CommunityDisplay";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import TaskService from "@/components/task/TaskService";
import type { Task as AppTask } from "@/types/task"; 
import type { Hormone } from "@/types/hormone";
import type { Reward } from "@/types/reward";
import RewardDisplay from "@/components/rewards/RewardDisplay";
import { getAICoachNudge, useClientSideRandom } from "@/ai/coach";
import ContentDisplay from "@/components/content/ContentDisplay";
import type { User as AppUser } from "@/types/user"; 
import AvatarDisplay from "@/components/avatar/Avatar";
import { generateId } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Edit3, Brain, Zap, Wand2, ImagePlus, Loader2, Sparkles as SparklesIcon, Bell, BarChart3, ListChecks, LayoutDashboard, CalendarClock, PlusCircle, Lightbulb, User as UserIcon, LogIn, LogOut } from "lucide-react";
import { generateAvatar } from "@/ai/flows/generate-avatar-flow"; 
import { useToast } from "@/hooks/use-toast";
import { UserProvider as AppUserProvider, useUser as useAppUser } from "@/contexts/UserContext"; 
import { MoodLogsProvider, useMoodLogs } from "@/contexts/MoodLogsContext";
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase-messaging';
import { cn } from "@/lib/utils";
import { storeUserFCMToken, sendNotificationToUser } from '@/actions/fcm-actions';
import { AuthContextProvider, useAuth } from "@/contexts/AuthContext";
// import { auth, googleAuthProvider, handleSignOut as firebaseLibSignOut } from '@/lib/firebase'; // No longer needed here
// import { signInWithPopup } from 'firebase/auth'; // No longer needed here
import { signInWithGoogle, signOutUser } from '@/services/authService'; // Import new auth service
import { getRandomHormone } from "@/ai/hormone-prediction";


const LOCAL_STORAGE_KEY_TASKS_PREFIX = "vibeCheckTasks_";
const LOCAL_STORAGE_KEY_REWARDS_PREFIX = "vibeCheckRewards_";
const LOCAL_STORAGE_KEY_NEUROPOINTS_PREFIX = "vibeCheckNeuroPoints_";


function MainAppInterface() {
  const { moodLogs, handleLogMood: contextHandleLogMood } = useMoodLogs();
  const { user: authUser } = useAuth(); 
  const { user: appUser, setUser: setAppUser } = useAppUser(); 

  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [neuroPoints, setNeuroPoints] = useState<number>(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [avatarDescription, setAvatarDescription] = useState<string>("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const getLocalStorageKey = (prefix: string, userId?: string) => {
    if (!userId) { 
        return `${prefix}guest_fallback`; 
    }
    if (userId.startsWith('guest_')) return `${prefix}guest`;
    return `${prefix}${userId}`;
  };


  useEffect(() => {
    setIsClient(true); 
  }, []);

  useEffect(() => {
    if (!isClient || !appUser) return;

    const userSpecificId = appUser.id;

    const tasksKey = getLocalStorageKey(LOCAL_STORAGE_KEY_TASKS_PREFIX, userSpecificId);
    const storedTasks = localStorage.getItem(tasksKey);
    if (storedTasks) setTasks(JSON.parse(storedTasks));
    else setTasks([]);
    
    const rewardsKey = getLocalStorageKey(LOCAL_STORAGE_KEY_REWARDS_PREFIX, userSpecificId);
    const storedRewards = localStorage.getItem(rewardsKey);
    if (storedRewards) setRewards(JSON.parse(storedRewards));
    else setRewards(userSpecificId.startsWith('guest_') ? 
        [{ id: generateId(), name: "Quick Vibe Boost (Guest)", description: "A little something for our guest!", pointsRequired: 20, isUnlocked: false, type: "virtual" }]
        :
        [{ id: generateId(), name: "15 Min Guided Chill Sesh", description: "Unlock a new meditation track. Issa vibe.", pointsRequired: 50, isUnlocked: false, type: "virtual" },
         { id: generateId(), name: "Affirmation Pack Drop", description: "Get a fresh pack of positive affirmations. You got this!", pointsRequired: 100, isUnlocked: false, type: "virtual" }]
    );
    
    const pointsKey = getLocalStorageKey(LOCAL_STORAGE_KEY_NEUROPOINTS_PREFIX, userSpecificId);
    const storedPoints = localStorage.getItem(pointsKey);
    if (storedPoints) setNeuroPoints(JSON.parse(storedPoints));
    else setNeuroPoints(0);

  }, [isClient, appUser]);


  useEffect(() => {
    if (isClient && appUser) { 
      const userSpecificId = appUser.id;
      localStorage.setItem(getLocalStorageKey(LOCAL_STORAGE_KEY_TASKS_PREFIX, userSpecificId), JSON.stringify(tasks));
      localStorage.setItem(getLocalStorageKey(LOCAL_STORAGE_KEY_REWARDS_PREFIX, userSpecificId), JSON.stringify(rewards));
      localStorage.setItem(getLocalStorageKey(LOCAL_STORAGE_KEY_NEUROPOINTS_PREFIX, userSpecificId), JSON.stringify(neuroPoints));
    }
  }, [tasks, rewards, neuroPoints, isClient, appUser]); 


  const taskService = useMemo(() => {
    if (!isClient || !appUser) return null; 
    return new TaskService(appUser);
  }, [appUser, isClient]);


  useEffect(() => {
    if (isClient && authUser && appUser && setAppUser) { 
      requestNotificationPermission().then(async token => {
        if (token) {
          const result = await storeUserFCMToken(authUser.uid, token);
          if (result.success) {
             setAppUser(prevAppUser => prevAppUser ? ({ ...prevAppUser, fcmToken: token }) : null);
            toast({ title: "Notifications Enabled! 🔔", description: "You'll get cool updates now. Low-key excited!" });
          } else {
             toast({ title: "Uh Oh! 😥", description: `Failed to save notification settings: ${result.message}. Try again later, fam.`, variant: "destructive"});
          }
        } else {
           toast({ title: "No Stress! 😎", description: "Notifications are off. You can change this in browser settings anytime, no cap.", variant: "default"});
        }
      });

      const unsubscribePromise = onMessageListener().then(unsubscribeFn => unsubscribeFn)
        .catch(err => { console.error('Failed to listen for foreground messages: ', err); return () => {}; });
      
      return () => { unsubscribePromise.then(fn => { if (typeof fn === 'function') fn(); }); };
    }
  }, [isClient, authUser, appUser, setAppUser, toast]);


  useEffect(() => {
    if (isClient && tasks.length === 0 && taskService && appUser && moodLogs) {
      const initializeTasks = async () => {
        const defaultTaskData: Omit<AppTask, 'id' | 'isCompleted'>[] = [
          { name: "10 min Zen Time", description: "Quick mindfulness meditation. Slay.", rewardPoints: 10, hasNeuroBoost: true },
          { name: "30 min Move Sesh", description: "Get that body movin'. No cap.", rewardPoints: 20, hasNeuroBoost: false },
        ];
        
        const newTasksPromises = defaultTaskData.map(async (taskData) => {
          if(!taskService || !appUser) return null; 
          return taskService.createTask(taskData);
        });
        const newTasks = (await Promise.all(newTasksPromises)).filter(Boolean) as AppTask[];
        setTasks(newTasks);
      };
      initializeTasks();
    }
  }, [isClient, taskService, appUser, moodLogs, tasks.length]);


  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      toast({
        title: "Signed In! 🎉",
        description: "You're logged in with Google. Let's vibe!",
      });
      // AuthContext will handle updating appUser
    } else {
      toast({
        title: "Sign-In Hiccup 😬",
        description: `Couldn't sign you in: ${result.message || 'Unknown error'}. Try again?`,
        variant: "destructive",
      });
    }
  };

  const handleFirebaseSignOutInternal = async () => {
    const result = await signOutUser();
    if (result.success) {
      toast({
        title: "Signed Out! 👋",
        description: "You've successfully signed out. Catch ya later!",
      });
      // AuthContext will handle updating appUser to guest or null
    } else {
      toast({
        title: "Sign-Out Fail 😥",
        description: `Couldn't sign you out: ${result.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleTaskCompletion = (taskId: string) => {
    if (!taskService || !appUser || !setAppUser) return; 
    const taskToComplete = tasks.find(t => t.id === taskId);
    if (!taskToComplete || taskToComplete.isCompleted) return;

    const updatedTask = taskService.updateTask(taskId, { isCompleted: true });
    if (updatedTask) {
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
      setNeuroPoints(prevPoints => prevPoints + (updatedTask.rewardPoints * (updatedTask.hasNeuroBoost ? 10 : 1)));
      setAppUser(prevAppUser => {
        if (!prevAppUser) return null;
        return {
          ...prevAppUser,
          completedTasks: [...prevAppUser.completedTasks, updatedTask],
          streak: taskService.user.streak 
        };
      });

      if (appUser.fcmToken && authUser) { 
        sendNotificationToUser(authUser.uid, { 
          title: "Quest Smashed! 🚀",
          body: `You just crushed '${updatedTask.name}'! Keep that W energy!`,
          data: { taskId: updatedTask.id }
        }).then(response => {
          if (response.success) console.log("Task completion notification sent!");
          else console.error("Failed to send task completion notification:", response.message);
        });
      }
    }
  };
  
  const handleClaimReward = (rewardId: string) => {
    if (!appUser || !setAppUser) return;
    const rewardToClaim = rewards.find(r => r.id === rewardId);
    if (rewardToClaim && !rewardToClaim.isUnlocked && neuroPoints >= rewardToClaim.pointsRequired) {
      setNeuroPoints(prev => prev - rewardToClaim.pointsRequired);
      setRewards(prevRewards => prevRewards.map(r => r.id === rewardId ? {...r, isUnlocked: true} : r));
      setAppUser(prevAppUser => {
        if (!prevAppUser) return null;
        return {
          ...prevAppUser,
          claimedRewards: [...prevAppUser.claimedRewards, {...rewardToClaim, isUnlocked: true}]
        };
      });
    }
  };

  const handleGenerateAvatar = async () => {
    if (!appUser || !setAppUser) return; 
    if (avatarDescription.trim().length < 10) {
      toast({ title: "Yo, Hold Up! 🧐", description: "Your avatar prompt needs a bit more spice! At least 10 chars, fam.", variant: "destructive" });
      return;
    }
    setIsGeneratingAvatar(true);
    try {
      const result = await generateAvatar({ 
        userId: appUser.id, 
        description: avatarDescription,
        previousAvatarPath: appUser.avatar?.imagePath 
      });
      setAppUser(prevAppUser => {
        if(!prevAppUser) return null;
        return {
          ...prevAppUser,
          avatar: {
            ...(prevAppUser.avatar || { id: generateId(), name: 'New Avatar', description: '' }), 
            imageUrl: result.imageUrl,
            imagePath: result.imagePath, 
            description: `AI-generated: ${avatarDescription}`, 
          }
        };
      });
      toast({ title: "Avatar Leveled Up! ✨🚀", description: "Your new AI-generated vibe is live! Looking fresh!" });
      setAvatarDescription(""); 
    } catch (error: any) {
      console.error("Avatar generation failed:", error);
      toast({ title: "AI Brain Fart! 🧠💨", description: error.message || "Couldn't generate your avatar.", variant: "destructive" });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!authUser || !appUser?.fcmToken) { 
      toast({ title: "Can't Send Push! 🚧", description: "This is for logged-in users with notifications enabled.", variant: "destructive" });
      return;
    }
    setIsSendingNotification(true);
    const result = await sendNotificationToUser(authUser.uid, { 
      title: "Vibe Check Test! 🧪",
      body: `Yo ${appUser.name}, this is a test notification! It's giving... works! 🎉`,
      data: { test: "true" }
    });
    setIsSendingNotification(false);
    if (result.success) toast({ title: "Test Notification Sent! 📬", description: "Check your device, it should pop off!" });
    else toast({ title: "Push Fail! 😭", description: `Couldn't send test notification: ${result.message}`, variant: "destructive" });
  };

  const incompleteTasks = useMemo(() => tasks.filter(t => !t.isCompleted), [tasks]);
  const randomIncompleteTask = useClientSideRandom(incompleteTasks);
  
  const nudge = useMemo(() => {
    if (!isClient || !appUser) return "Loading your dose of awesome... ⏳";
    return getAICoachNudge(appUser, randomIncompleteTask ?? null);
  }, [appUser, randomIncompleteTask, isClient]);

  const existingDates = moodLogs.map((log) => log.date);

  useEffect(() => {
     const fetchTaskSuggestions = async () => {
      if (isClient && taskService && appUser && moodLogs && moodLogs.length > 0) { 
        const suggestedTaskDetails = await taskService.getSuggestedTasks(moodLogs, appUser.hormoneLevels, appUser.completedTasks); 
        if (suggestedTaskDetails && suggestedTaskDetails.suggestions) {
          const newTasksPromises = suggestedTaskDetails.suggestions.map(async (taskDetail) => {
            if(!taskService || !appUser) return null;
            return taskService.createTask({ 
              name: taskDetail.name,
              description: taskDetail.description,
              hasNeuroBoost: taskDetail.hasNeuroBoost,
            });
          });
          const newTasksResult = (await Promise.all(newTasksPromises)).filter(Boolean) as AppTask[];
          setTasks(prevTasks => {
            const existingTaskNames = new Set(prevTasks.map(t => t.name));
            const uniqueNewTasks = newTasksResult.filter(nt => !existingTaskNames.has(nt.name));
            return [...prevTasks, ...uniqueNewTasks]; 
          });
        }
      }
    };
    
    if (appUser && tasks.length <= 5 && moodLogs && moodLogs.length > 0) { 
       fetchTaskSuggestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, taskService, appUser, moodLogs]); 
  
  const handleGuestSignIn = () => {
    // In AuthContext, if authUser is null, a guest AppUser is created.
    // We can trigger a re-check in AuthContext or simply rely on it.
    // For now, AuthContext handles guest creation on initial load if no authUser.
    // This button could potentially clear any existing authUser (sign out if any)
    // then rely on AuthContext to establish a guest session.
    // Or, if already guest, it does nothing.
    if (authUser) {
        handleFirebaseSignOutInternal().then(() => {
            toast({ title: "Continuing as Guest! 👋", description: "You're now exploring as a guest."});
        });
    } else {
        toast({ title: "You're already a Guest! ✨", description: "Exploring the vibes, no strings attached!"});
    }
  };

  if (!appUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-4">
        <div className="text-center space-y-6">
            <SparklesIcon className="h-16 w-16 text-accent mx-auto animate-pulse" />
            <h1 className="text-4xl font-extrabold text-primary drop-shadow-md">Welcome to Vibe Check!</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Your personal space to track moods, smash quests, and ride the good vibes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleGoogleSignIn} className="text-lg py-3 px-6 shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90">
                    <svg className="mr-2 -ml-1 w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    Sign In with Google
                </Button>
                 <Button onClick={handleGuestSignIn} variant="outline" className="text-lg py-3 px-6 shadow-md hover:shadow-lg">
                    <UserIcon className="mr-2 h-5 w-5" /> Or Continue as Guest
                </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-6">
                By continuing, you agree to our imaginary Terms of Service and Privacy Policy.
            </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header>
        <Header.AuthSection
          authUser={authUser}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleFirebaseSignOutInternal}
        />
      </Header>
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">

           <section className="lg:col-span-1 space-y-6">
            <Card className="shadow-md border-accent">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle className="drop-shadow-sm font-extrabold text-2xl text-primary">My Vibe</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => toast({title: "Profile Edit Soon!", description:"This feature is cookin'!"})}  className="mr-1">
                      <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-muted-foreground">
                  Track your journey and glow up, bestie! ✨
                </CardDescription> 
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3 ">
                <AvatarDisplay 
                  avatar={appUser?.avatar || null} 
                  size={100} 
                />
                <h2 className="text-2xl font-bold tracking-tight text-center">{appUser?.name || "Vibe User"}</h2>
                <p className="text-sm text-muted-foreground">Streak: {appUser?.streak || 0} days <Zap className="inline h-4 w-4 text-yellow-400 fill-yellow-400" /></p>
                <p className="text-3xl font-extrabold text-primary drop-shadow-md">VibePoints: {neuroPoints} VP</p>
                <div className="w-full text-center">
                  <div className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-center w-full text-sm")}>
                   <LayoutDashboard className="mr-2 h-4 w-4" />
                   <span className="text-xs">Tap to expand</span>
                  </div>
                 {nudge && <p className="text-sm text-center p-3 bg-primary/10 rounded-lg text-primary shadow-sm">{nudge}</p>}
                </div>
              </CardContent>
              <CardContent className="flex justify-center">
                {authUser && appUser?.fcmToken && (<Button onClick={handleSendTestNotification} disabled={isSendingNotification} variant="outline" size="sm" > {isSendingNotification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}{isSendingNotification ? "Sending..." : "Test Push"}</Button> )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="flex flex-col space-y-2">
                <CardTitle className="flex items-center gap-2 drop-shadow-sm font-extrabold text-xl text-primary">
                  <ImagePlus className="h-5 w-5 text-primary" /> AI Avatar Studio ✨
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Unleash your inner artist! Describe your dream avatar, and watch our AI bring it to life. 🎨
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., 'a neon-lit cyberpunk fox with headphones', 'a serene cosmic jellyfish floating in a nebula', 'a retro pixel art robot chilling on a cloud'"
                  value={avatarDescription}
                  onChange={(e) => setAvatarDescription(e.target.value)}
                  maxLength={200}
                  className="min-h-[100px] focus:bg-background shadow-inner"
                  disabled={isGeneratingAvatar}
                />
                <Button
                  onClick={handleGenerateAvatar}
                  disabled={isGeneratingAvatar || avatarDescription.trim().length < 10 || avatarDescription.trim().length > 200 }
                  className="w-full shadow-md hover:shadow-lg active:shadow-inner transition-all"
                >
                  {isGeneratingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  {isGeneratingAvatar ? "AI Makin' Magic..." : "Generate My Vibe!"}
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="lg:col-span-2 flex flex-col space-y-6">
             <Card className="shadow-md border-accent">
              <CardHeader className="flex flex-col space-y-2">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle className="drop-shadow-sm font-extrabold text-xl text-primary flex items-center gap-2"><CalendarClock className="mr-2 h-5 w-5" />Daily Vibe Check</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  How are you feeling today? Log your mood, fam. ✨
                </CardDescription>
              </CardHeader>
                <CardContent>
                  <MoodLogForm onLogMood={contextHandleLogMood} existingDates={existingDates} />
                </CardContent>
            </Card>

            <Card className="shadow-md border-accent">
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-extrabold text-xl drop-shadow-sm flex items-center"><BarChart3 className="mr-2 h-5 w-5" />Mood Insights</CardTitle> 
                </CardHeader>
                 <CardContent><MoodChart moodLogs={moodLogs} /></CardContent>
            </Card>

            {appUser && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 drop-shadow-sm font-extrabold text-xl text-primary"><Brain className="h-5 w-5 text-primary"/>Brain Juice Levels</CardTitle>
                  <CardDescription className="text-muted-foreground">Peep what your brain's cookin' up, bestie.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><SparklesIcon className="inline h-4 w-4 mr-1 text-blue-500" />Dopamine: <span className="font-semibold">{appUser.hormoneLevels.dopamine}%</span></div>
                  <div><Zap className="inline h-4 w-4 mr-1 text-red-500" />Adrenaline: <span className="font-semibold">{appUser.hormoneLevels.adrenaline}%</span></div>
                  <div><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline h-4 w-4 mr-1 text-orange-500"><path d="M18 10H6L3 18h18l-3-8Z"/><path d="M12 6V2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>Cortisol: <span className="font-semibold">{appUser.hormoneLevels.cortisol}%</span></div>
                  <div><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline h-4 w-4 mr-1 text-green-500"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>Serotonin: <span className="font-semibold">{appUser.hormoneLevels.serotonin}%</span></div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 drop-shadow-sm font-extrabold text-xl text-primary"><ListChecks className="h-5 w-5 text-primary"/>Today's Quests</CardTitle>
                 <CardDescription className="text-muted-foreground">Small W's = Big Vibe Energy. Complete quests to get VibePoints!</CardDescription>
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
                        <Button onClick={() => handleTaskCompletion(task.id)} size="sm" variant="default" className="shadow hover:shadow-md active:shadow-inner">
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
             <Card className="shadow-md border-accent">
                <CardHeader className="flex flex-col space-y-2">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle className="drop-shadow-sm font-extrabold text-xl flex items-center text-primary"><Lightbulb className="mr-2 h-5 w-5" />AI Suggestions</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                     Check what the AI have for you!
                  </CardDescription>
                </CardHeader>
               <CardContent>
                 <PersonalizedInsights moodLogs={moodLogs} />
               </CardContent>
            </Card>
          </section>
        </div>
        
        <section className="lg:col-span-3 space-y-6 mt-10">
           <RewardDisplay rewards={rewards} neuroPoints={neuroPoints} onClaimReward={handleClaimReward} />
        </section>
        <section className="lg:col-span-3 space-y-6 mt-10">
           <CommunityDisplay />
        </section>
        <section className="lg:col-span-3 space-y-6 mt-10">
           <ContentDisplay />
        </section>
      </main>
      <footer className="text-center p-6 border-t border-border/50 text-sm text-muted-foreground mt-10">
        <p>&copy; {new Date().getFullYear()} Vibe Check. Keep it 💯. ✌️</p> 
      </footer>
    </div>
  );
}

// function AppPageLogic() { 
//   const { loading: authLoading } = useAuth();
//   const { user: appUser } = useAppUser();

//   if (authLoading || !appUser) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
//         <Loader2 className="h-12 w-12 animate-spin text-accent" />
//         <p className="text-lg ml-4 text-accent font-semibold">Checking your Vibe ID... ✨</p>
//       </div>
//     );
//   }
//   return <MainAppInterface />;
// }

export default function RootPage() { 
  return (
    <AppUserProvider> 
      <AuthContextProvider> 
        <MoodLogsProvider>
          <MainAppInterface />
        </MoodLogsProvider>
      </AuthContextProvider>
    </AppUserProvider>
  );
}
    
