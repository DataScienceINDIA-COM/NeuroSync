
"use client";

import { useEffect, useState, useMemo } from "react";
import type { MoodLog, Mood } from "@/types/mood"; // Added Mood type
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
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, getDayOfYear } from "date-fns";
import TaskService from "@/components/task/TaskService";
import type { Task as AppTask } from "@/types/task"; 
import type { Reward } from "@/types/reward";
import RewardDisplay from "@/components/rewards/RewardDisplay";
import { getAICoachNudge, useClientSideRandom } from "@/ai/coach";
import { AICoachCard } from "@/components/coach/AICoachCard";
import ContentDisplay from "@/components/content/ContentDisplay";
import type { User as AppUser } from "@/types/user"; 
import AvatarDisplay from "@/components/avatar/AvatarDisplay";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit3, Brain, Zap, Wand2, ImagePlus, Loader2, Sparkles as SparklesIcon, Bell, BarChart3, ListChecks, LayoutDashboard, CalendarClock, PlusCircle, Lightbulb, User as UserIcon, LogIn, LogOut, Save, XCircle, ChevronDown, MessageCircle } from "lucide-react";
import { generateAvatar } from "@/ai/flows/generate-avatar-flow"; 
import { useToast } from "@/hooks/use-toast";
import { UserProvider as AppUserProvider, useUser as useAppUser } from "@/contexts/UserContext"; 
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase-messaging';
import type { MessagePayload } from "firebase/messaging";
import { storeUserFCMToken, sendNotificationToUser } from '@/actions/fcm-actions';
import { AuthContextProvider, useAuth } from "@/contexts/AuthContext";
import { signOutUser } from '@/services/authService'; 
import FirebaseUIWidget from '@/components/auth/FirebaseUIWidget';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MoodLogsProvider, useMoodLogs } from "@/contexts/MoodLogsContext";
import { auth } from '@/lib/firebase';
import { OnboardingDialog } from '@/components/onboarding/OnboardingDialog';
import { completeOnboardingAction } from '@/actions/user-actions';


function MainAppInterface() {
  const { authUser } = useAuth(); 
  const { user: appUser, setUser: setAppUser } = useAppUser(); 
  const { moodLogs, addMoodLog } = useMoodLogs();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [avatarDescription, setAvatarDescription] = useState<string>("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const taskService = useMemo(() => {
    if (!isClient) return null; 
    // TaskService is now stateless, no need to pass appUser to constructor
    return new TaskService(); 
  }, [isClient]);


  useEffect(() => {
    setIsClient(true); 
    // Onboarding check moved to AppPageLogic to ensure appUser is fully initialized
  }, []);

  const handleOnboardingComplete = async () => {
    if (appUser && setAppUser) {
      if (!appUser.id.startsWith('guest_')) { // Only call Firestore for registered users
        const result = await completeOnboardingAction(appUser.id);
        if (!result.success) {
          toast({
            title: "Onboarding Sync Issue",
            description: result.message || "Could not save onboarding status to server.",
            variant: "destructive",
          });
        }
      }
      // Update local state regardless
      setAppUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
      setShowOnboarding(false); // Hide dialog
    }
  };

  // Logic to determine if onboarding should be shown
  useEffect(() => {
    if (isClient && appUser) {
      setShowOnboarding(!appUser.onboardingCompleted);
    }
  }, [isClient, appUser, appUser?.onboardingCompleted]);


  // FCM Token Setup and Foreground Message Listener Effect
  useEffect(() => {
    if (isClient && authUser && appUser && !appUser.id.startsWith('guest_') && setAppUser) { 
      const setupNotifications = async () => {
        try {
          const token = await requestNotificationPermission();
          if (token) {
            const result = await storeUserFCMToken(authUser.uid, token); 
            if (result.success) {
               setAppUser(prevAppUser => prevAppUser ? ({ ...prevAppUser, fcmToken: token }) : null);
              toast({ title: "Notifications On Fleek! 🔔", description: "You'll get cool updates now. Low-key excited!" });
            } else {
               toast({ title: "Bummer! 😥", description: `Failed to save notification settings: ${result.message}. Try again later, fam.`, variant: "destructive"});
            }
          } else {
             toast({ title: "No Stress! 😎", description: "Notifications are off. You can change this in browser settings anytime, no cap.", variant: "default"});
          }
        } catch (err) {
          console.error("Error setting up notification permissions:", err);
          toast({ title: "Notification Setup Issue", description: "Could not set up notifications.", variant: "destructive" });
        }
      };
      setupNotifications();

      const handleForegroundMessage = (payload: MessagePayload) => {
        console.log('Foreground message handled in page:', payload);
        toast({
          title: payload.notification?.title || "Vibe Check!",
          description: payload.notification?.body || "You've got a new update!",
        });
      };
      
      const unsubscribePromise = onMessageListener(handleForegroundMessage)
        .then(unsubscribeFn => unsubscribeFn)
        .catch(err => { 
          console.error('Failed to set up foreground message listener: ', err); 
          return () => {}; 
        });
      
      return () => { 
        unsubscribePromise.then(fn => { 
          if (typeof fn === 'function') {
            fn(); 
          }
        }); 
      };
    }
  }, [isClient, authUser, appUser, setAppUser, toast]);


  // AI Task Suggestions Effect
  useEffect(() => {
    const fetchTaskSuggestions = async () => {
     if (isClient && appUser && appUser.moodLogs && appUser.tasks.length <= 5 && !appUser.id.startsWith('guest_') && taskService) {
       // Ensure completedTasks is an array even if undefined initially
       const completedTasksForAI = appUser.tasks?.filter(t => t.isCompleted) || [];
       const suggestedTaskDetailsOutput = await taskService.getSuggestedTasks(appUser.moodLogs, appUser.hormoneLevels, completedTasksForAI);
       
       if (suggestedTaskDetailsOutput && suggestedTaskDetailsOutput.suggestions) {
         const newTasksPromises = suggestedTaskDetailsOutput.suggestions.map(async (taskDetail) => { // taskDetail is now { name, description, hasNeuroBoost }
            const points = await taskService.calculateRewardPointsForTask(taskDetail.description, appUser.moodLogs?.[0]?.mood || 'Neutral', appUser.hormoneLevels);
            return taskService.createTaskObject({ 
              name: taskDetail.name,
              description: taskDetail.description,
              hasNeuroBoost: taskDetail.hasNeuroBoost,
              rewardPoints: points, 
            });
         });
         const newTasksResult = (await Promise.all(newTasksPromises)).filter(Boolean) as AppTask[];
         
         setAppUser(prevUser => {
           if (!prevUser) return null;
           const existingTaskNames = new Set(prevUser.tasks.map(t => t.name));
           const uniqueNewTasks = newTasksResult.filter(nt => !existingTaskNames.has(nt.name));
           return { ...prevUser, tasks: [...prevUser.tasks, ...uniqueNewTasks] };
         });
       }
     }
   };
   
   if (appUser && appUser.moodLogs && appUser.moodLogs.length > 0 && !appUser.id.startsWith('guest_')) { 
      fetchTaskSuggestions();
   }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, taskService, appUser?.id, appUser?.moodLogs?.length]); // appUser.tasks.length removed to prevent loop if tasks are added


  const handleFirebaseSignOutInternal = async () => {
    const result = await signOutUser(); 
    if (result.success) {
      toast({ title: "Signed Out! 👋", description: "You've successfully signed out. Catch ya later!"});
    } else {
      toast({ title: "Sign-Out Fail 😥", description: `Couldn't sign you out: ${result.message || 'Unknown error'}`, variant: "destructive"});
    }
  };


  const handleTaskCompletion = async (taskId: string) => {
    if (!appUser || !setAppUser || !taskService) return;
    const taskToComplete = appUser.tasks.find(t => t.id === taskId);
    if (!taskToComplete || taskToComplete.isCompleted) return;

    const updatedTasks = taskService.updateTaskInList(taskId, { isCompleted: true }, appUser.tasks);
    const completedTask = updatedTasks.find(t => t.id === taskId); 

    if (completedTask) {
      const newNeuroPoints = appUser.neuroPoints + (completedTask.rewardPoints * (completedTask.hasNeuroBoost ? 10 : 1));
      const currentDayOfYear = getDayOfYear(new Date());
      let newStreak = appUser.streak;
      let newLastCompletedDay = appUser.lastCompletedDay;

      if (appUser.lastCompletedDay !== currentDayOfYear) {
        if (appUser.lastCompletedDay === currentDayOfYear -1 || (currentDayOfYear === 0 && appUser.lastCompletedDay === 365) ) { // Check for consecutive day or year wrap-around
          newStreak +=1;
        } else {
          newStreak = 1; // Reset streak if not consecutive
        }
        newLastCompletedDay = currentDayOfYear;
      } 
      
      setAppUser(prevUser => {
        if (!prevUser) return null;
        return { 
          ...prevUser, 
          tasks: updatedTasks,
          neuroPoints: newNeuroPoints,
          streak: newStreak,
          lastCompletedDay: newLastCompletedDay
        };
      });

      if (authUser && appUser.fcmToken && !appUser.id.startsWith('guest_')) { 
        sendNotificationToUser(authUser.uid, { 
          title: "Quest Smashed! 🚀",
          body: `You just crushed '${completedTask.name}'! Keep that W energy!`,
          data: { taskId: completedTask.id, url: `/tasks/${completedTask.id}` } // Example deep link
        }).then(response => {
          if (response.success) console.log("Task completion notification sent!");
          else console.error("Failed to send task completion notification:", response.message);
        });
      }
    }
  };
  
  const handleClaimReward = (rewardId: string) => {
    if (!appUser || !setAppUser) return;
    const rewardToClaim = appUser.rewards.find(r => r.id === rewardId);
    if (rewardToClaim && !rewardToClaim.isUnlocked && appUser.neuroPoints >= rewardToClaim.pointsRequired) {
      const newNeuroPoints = appUser.neuroPoints - rewardToClaim.pointsRequired;
      const updatedRewards = appUser.rewards.map(r => r.id === rewardId ? {...r, isUnlocked: true} : r);
      
      setAppUser(prevUser => {
        if (!prevUser) return null;
        return { 
          ...prevUser, 
          rewards: updatedRewards,
          neuroPoints: newNeuroPoints,
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
      setAppUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          avatar: {
            id: prevUser.avatar?.id || generateId(),
            name: prevUser.avatar?.name || 'New Avatar',
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
    if (!authUser || !appUser?.fcmToken || appUser.id.startsWith('guest_')) { 
      toast({ title: "Can't Send Push! 🚧", description: "This is for logged-in users with notifications enabled.", variant: "destructive" });
      return;
    }
    setIsSendingNotification(true);
    const result = await sendNotificationToUser(authUser.uid, { 
      title: "Vibe Check Test! 🧪",
      body: `Yo ${appUser.name}, this is a test notification! It's giving... works! 🎉`,
      data: { test: "true", url: "/" } 
    });
    setIsSendingNotification(false);
    if (result.success) toast({ title: "Test Notification Sent! 📬", description: "Check your device, it should pop off!" });
    else toast({ title: "Push Fail! 😭", description: `Couldn't send test notification: ${result.message}`, variant: "destructive" });
  };

  const handleEditProfile = () => {
    if (appUser) {
      setEditingName(appUser.name);
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = () => {
    if (appUser && setAppUser && editingName.trim() !== "") {
      setAppUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, name: editingName.trim() };
      });
      setIsEditingProfile(false);
      toast({ title: "Profile Updated! 💅", description: "Your name is looking fresh!" });
    } else if (editingName.trim() === "") {
      toast({ title: "Hold Up! 🤔", description: "Name can't be empty, fam.", variant: "destructive" });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  const incompleteTasks = useMemo(() => appUser?.tasks.filter(t => !t.isCompleted) || [], [appUser?.tasks]);
  const randomIncompleteTask = useClientSideRandom(incompleteTasks);
  
  const aiNudge = useMemo(() => {
    if (!isClient || !appUser) return "Loading your dose of awesome... ⏳";
    return getAICoachNudge(appUser, randomIncompleteTask ?? null);
  }, [appUser, randomIncompleteTask, isClient]);

  const existingDates = moodLogs.map((log) => log.date) || [];
  
  if (!isClient || !appUser ) { 
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-4" role="alert" aria-live="polite">
            <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" aria-hidden="true" />
            <p className="text-muted-foreground">Getting your main vibe ready...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {showOnboarding && <OnboardingDialog isOpen={showOnboarding} onComplete={handleOnboardingComplete} />}
      <Header>
        <Header.AuthSection
          authUser={authUser} 
          onSignOut={handleFirebaseSignOutInternal}
        />
      </Header>
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">

           <section aria-labelledby="my-vibe-title" className="lg:col-span-1 space-y-6">
           <Card className="shadow-lg border-primary/50 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/80 to-accent/80 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-7 w-7 text-primary-foreground drop-shadow-md" aria-hidden="true" />
                    <CardTitle id="my-vibe-title" className="text-2xl font-bold tracking-tight text-primary-foreground drop-shadow-md">
                      My Vibe
                    </CardTitle>
                  </div>
                  {!isEditingProfile && (
                    <Button variant="ghost" size="icon" onClick={handleEditProfile} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20 rounded-full" aria-label="Edit profile name">
                        <Edit3 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                <CardDescription className="text-sm text-primary-foreground/90 pt-1 italic">
                  Track your journey and glow up, bestie! ✨
                </CardDescription> 
              </CardHeader>
              <CardContent className="p-5 flex flex-col items-center space-y-4 bg-background">
                <AvatarDisplay 
                  avatar={appUser.avatar || null} 
                  size={100} 
                />
                {isEditingProfile ? (
                  <div className="w-full space-y-3">
                    <Input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Your cool name"
                      aria-label="Edit your name"
                      className="text-center text-lg font-semibold border-primary/50 focus:ring-primary"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleSaveProfile} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                        <Save className="mr-1 h-4 w-4" /> Save
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                        <XCircle className="mr-1 h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold tracking-tight text-center text-foreground">{appUser.name || "Vibe User"}</h2>
                )}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Streak: <span className="font-bold text-amber-500">{appUser.streak || 0} days</span> <Zap className="inline h-4 w-4 text-amber-400 fill-amber-400" aria-label="Streak icon" /></p>
                    <p className="text-3xl font-extrabold text-primary drop-shadow-md mt-1">VibePoints: {appUser.neuroPoints} VP</p>
                </div>
                <AICoachCard user={appUser} nudge={aiNudge} />

              </CardContent>
              <CardFooter className="p-5 bg-background border-t border-border/30 flex justify-center">
                {authUser && appUser.fcmToken && !appUser.id.startsWith('guest_') && (<Button onClick={handleSendTestNotification} disabled={isSendingNotification} variant="outline" size="sm" className="border-accent/50 text-accent hover:bg-accent/10" > {isSendingNotification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Loading" /> : <Bell className="mr-2 h-4 w-4" aria-hidden="true" />}{isSendingNotification ? "Sending..." : "Test Push"}</Button> )}
              </CardFooter>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="flex flex-col space-y-2">
                <CardTitle id="avatar-studio-title" className="flex items-center gap-2 drop-shadow-sm font-extrabold text-xl text-primary">
                  <ImagePlus className="h-5 w-5 text-primary" aria-hidden="true" /> AI Avatar Studio ✨
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Unleash your inner artist! Describe your dream avatar, and watch our AI bring it to life. 🎨
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  aria-labelledby="avatar-studio-title"
                  placeholder="e.g., 'a neon-lit cyberpunk fox with headphones', 'a serene cosmic jellyfish floating in a nebula', 'a retro pixel art robot chilling on a cloud'"
                  value={avatarDescription}
                  onChange={(e) => setAvatarDescription(e.target.value)}
                  maxLength={200}
                  className="min-h-[100px] focus:bg-background shadow-inner"
                  disabled={isGeneratingAvatar || (appUser && appUser.id.startsWith('guest_'))} 
                />
                <Button
                  onClick={handleGenerateAvatar}
                  aria-label="Generate AI avatar"
                  disabled={isGeneratingAvatar || avatarDescription.trim().length < 10 || avatarDescription.trim().length > 200 || (appUser && appUser.id.startsWith('guest_'))}
                  className="w-full shadow-md hover:shadow-lg active:shadow-inner transition-all"
                >
                  {isGeneratingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Generating avatar" /> : <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />}
                  {isGeneratingAvatar ? "AI Makin' Magic..." : (appUser && appUser.id.startsWith('guest_') ? "Sign In to Generate" : "Generate My Vibe!")}
                </Button>
                 {appUser && appUser.id.startsWith('guest_') && <p className="text-xs text-muted-foreground text-center">Sign in to create your custom AI avatar!</p>}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="daily-vibe-check-title" className="lg:col-span-2 flex flex-col space-y-6">
             <Card className="shadow-md border-accent">
              <CardHeader className="flex flex-col space-y-2">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle id="daily-vibe-check-title" className="drop-shadow-sm font-extrabold text-xl text-primary flex items-center gap-2"><CalendarClock className="mr-2 h-5 w-5" aria-hidden="true" />Daily Vibe Check</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  How are you feeling today? Log your mood, fam. ✨
                </CardDescription>
              </CardHeader>
                <CardContent>
                  <MoodLogForm onLogMood={addMoodLog} existingDates={existingDates} />
                </CardContent>
            </Card>

            <Card className="shadow-md border-accent">
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle id="mood-insights-title" className="font-extrabold text-xl drop-shadow-sm flex items-center"><BarChart3 className="mr-2 h-5 w-5" aria-hidden="true" />Mood Insights</CardTitle> 
                </CardHeader>
                 <CardContent aria-labelledby="mood-insights-title"><MoodChart moodLogs={moodLogs} /></CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full shadow-lg rounded-xl border border-primary/30">
              <AccordionItem value="item-1">
                <Card className="border-none rounded-xl">
                  <AccordionTrigger className="w-full p-0 hover:no-underline" aria-label="Toggle hormone levels details">
                    <CardHeader className="flex flex-row items-center justify-between w-full pb-2 hover:bg-primary/5 rounded-t-xl group">
                      <div className="flex items-center gap-2">
                        <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
                        <CardTitle id="brain-juice-title" className="drop-shadow-sm font-extrabold text-xl text-primary">Brain Juice Levels</CardTitle>
                      </div>
                      <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4">
                      <div><SparklesIcon className="inline h-4 w-4 mr-1 text-blue-500" aria-hidden="true" />Dopamine: <span className="font-semibold">{appUser.hormoneLevels.dopamine}%</span></div>
                      <div><Zap className="inline h-4 w-4 mr-1 text-red-500" aria-hidden="true" />Adrenaline: <span className="font-semibold">{appUser.hormoneLevels.adrenaline}%</span></div>
                      <div>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline h-4 w-4 mr-1 text-orange-500" aria-hidden="true">
                              <path d="M18 10H6L3 18h18l-3-8Z"/><path d="M12 6V2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>
                          </svg>
                          Cortisol: <span className="font-semibold">{appUser.hormoneLevels.cortisol}%</span>
                      </div>
                      <div>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline h-4 w-4 mr-1 text-green-500" aria-hidden="true">
                              <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/>
                          </svg>
                          Serotonin: <span className="font-semibold">{appUser.hormoneLevels.serotonin}%</span>
                      </div>
                    </CardContent>
                     <CardContent className="pt-2 text-sm text-muted-foreground">
                      <p>These levels are estimated based on your logged moods and activities. Click to learn more about how each hormone impacts your vibe!</p>
                    </CardContent>
                    <CardDescription className="px-6 pb-4 text-xs text-muted-foreground/70">
                      Peep what your brain's cookin' up, bestie. Levels adjust based on your mood logs & tasks.
                    </CardDescription>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle id="todays-quests-title" className="flex items-center gap-2 drop-shadow-sm font-extrabold text-xl text-primary"><ListChecks className="h-5 w-5 text-primary" aria-hidden="true"/>Today's Quests</CardTitle>
                 <CardDescription className="text-muted-foreground">Small W's = Big Vibe Energy. Complete quests to get VibePoints!</CardDescription>
              </CardHeader>
              <CardContent aria-labelledby="todays-quests-title">
                {appUser.tasks.length > 0 ? (
                  <ul className="space-y-3">
                  {appUser.tasks.map((task) => (
                    <li key={task.id} className={`p-4 border rounded-xl flex justify-between items-center transition-all ${task.isCompleted ? "bg-muted opacity-60 shadow-inner" : "bg-card hover:shadow-md"}`}>
                      <div>
                        <h4 className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : "text-card-foreground"}`}>{task.name}</h4>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                        <p className="text-xs mt-1">
                          Reward: <span className="font-semibold text-accent">{task.rewardPoints} VP</span>
                          {task.hasNeuroBoost && <span className="ml-1 text-xs text-yellow-500 font-semibold">(<Brain className="inline h-3 w-3" aria-hidden="true"/> x10 Vibe Boost!)</span>}
                        </p>
                      </div>
                      {!task.isCompleted && (
                        <Button onClick={() => handleTaskCompletion(task.id)} size="sm" variant="default" className="shadow hover:shadow-md active:shadow-inner" aria-label={`Complete task: ${task.name}`}>
                          GG! 
                        </Button>
                      )}
                    </li>
                  ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center py-6">No quests today, fam. AI is cookin' some up, or add your own!</p> 
                )}
              </CardContent>
            </Card>
             <Card className="shadow-md border-accent">
                <CardHeader className="flex flex-col space-y-2">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle id="ai-suggestions-title" className="drop-shadow-sm font-extrabold text-xl flex items-center text-primary"><Lightbulb className="mr-2 h-5 w-5" aria-hidden="true" />AI Suggestions</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                     Check what the AI have for you!
                  </CardDescription>
                </CardHeader>
               <CardContent aria-labelledby="ai-suggestions-title">
                 <PersonalizedInsights moodLogs={moodLogs} />
               </CardContent>
            </Card>
          </section>
        </div>
        
        <section aria-labelledby="rewards-title" className="lg:col-span-3 space-y-6 mt-10">
           <RewardDisplay rewards={appUser.rewards} neuroPoints={appUser.neuroPoints} onClaimReward={handleClaimReward} />
        </section>
        <section aria-labelledby="community-title" className="lg:col-span-3 space-y-6 mt-10">
           <CommunityDisplay />
        </section>
        <section aria-labelledby="content-title" className="lg:col-span-3 space-y-6 mt-10">
           <ContentDisplay />
        </section>
      </main>
      <footer role="contentinfo" className="text-center p-6 border-t border-border/50 text-sm text-muted-foreground mt-10">
        <p>&copy; {new Date().getFullYear()} Vibe Check. Keep it 💯. ✌️</p> 
      </footer>
    </div>
  );
}


export default function RootPage() { 
  return (
    <AppUserProvider> 
      <AuthContextProvider> 
        <MoodLogsProvider> 
          <AppPageLogic />
        </MoodLogsProvider>
      </AuthContextProvider>
    </AppUserProvider>
  );
}

function AppPageLogic() {
  const { authUser, loading: authLoading } = useAuth(); 
  const { user: appUser, setUser: setAppUser } = useAppUser(); 
  const { toast } = useToast(); 
  const [guestSessionActive, setGuestSessionActive] = useState(false);
  

  const handleGuestSignIn = async () => {
    if (auth.currentUser) { 
        await signOutUser(); 
    }
    setAppUser(null); 
    setGuestSessionActive(true); 
    toast({ title: "Continuing as Guest! 👋", description: "You're now exploring as a guest. Some features may be limited."});
  };

  useEffect(() => {
    if (authUser) { 
      setGuestSessionActive(false); 
    } else if (appUser && appUser.id.startsWith('guest_')) { 
      setGuestSessionActive(true);
    } else { 
      setGuestSessionActive(false);
    }
  }, [authUser, appUser]);


  if (authLoading || (!appUser && !guestSessionActive && !authUser)) { 
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-4" role="alert" aria-live="polite">
        <Loader2 className="h-16 w-16 text-accent animate-spin mb-4" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-primary mb-2">Vibe Check</h1>
        <p className="text-muted-foreground">Warming up the good vibes... ✨</p>
      </div>
    );
  }
  
  if (authUser || (guestSessionActive && appUser?.id.startsWith('guest_'))) {
     return <MainAppInterface />;
  }
  
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center space-y-6 w-full max-w-md p-8 bg-card shadow-xl rounded-2xl border border-border">
          <SparklesIcon className="h-16 w-16 text-accent mx-auto animate-pulse" aria-hidden="true" />
          <h1 className="text-4xl font-extrabold text-primary drop-shadow-md">Welcome to Vibe Check!</h1>
          <p className="text-lg text-muted-foreground">
              Your personal space to track moods, smash quests, and ride the good vibes.
          </p>
          
          <FirebaseUIWidget />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button onClick={handleGuestSignIn} variant="outline" className="w-full text-lg py-3 shadow-md hover:shadow-lg" aria-label="Continue as Guest">
              <UserIcon className="mr-2 h-5 w-5" aria-hidden="true" /> Continue as Guest
          </Button>

            <p className="text-xs text-muted-foreground mt-6">
              By continuing, you agree to our imaginary Terms of Service and Privacy Policy.
          </p>
      </div>
    </div>
  );
}
