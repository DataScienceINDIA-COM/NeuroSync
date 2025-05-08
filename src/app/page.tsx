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
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import TaskService from "@/components/task/TaskService";
// import RewardService from "@/components/rewards/RewardService"; // No longer used directly for instantiation
import type { Task } from "@/types/task";
import { getRandomHormone, predictHormone } from "@/ai/hormone-prediction";
import type { Hormone } from "@/types/hormone";
import type { Reward } from "@/types/reward";
import RewardDisplay from "@/components/rewards/RewardDisplay";
import CommunityDisplay from "@/components/community/CommunityDisplay";
import { getAICoachNudge } from "@/ai/coach"; // getAICoachMessage removed as not used
import ContentDisplay from "@/components/content/ContentDisplay";
import type { User } from "@/types/user";
import AvatarDisplay from "@/components/avatar/Avatar"; // Updated import
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit3, Brain, Zap } from "lucide-react"; // Added icons

const LOCAL_STORAGE_KEY_MOOD = "moodBalanceLogs";
const LOCAL_STORAGE_KEY_TASKS = "moodBalanceTasks";
const LOCAL_STORAGE_KEY_USER = "moodBalanceUser";
const LOCAL_STORAGE_KEY_REWARDS = "moodBalanceRewards";
const LOCAL_STORAGE_KEY_NEUROPOINTS = "moodBalanceNeuroPoints";


export default function HomePage() {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  const [user, setUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (storedUser) return JSON.parse(storedUser);
    }
    return {
      id: generateId(),
      name: "User",
      completedTasks: [],
      claimedRewards: [],
      inProgressTasks: [],
      hormoneLevels: getRandomHormone(),
      avatar: {
        id: generateId(),
        name: "Avatar",
        description: "User's Avatar",
        imageUrl: `https://picsum.photos/seed/${generateId()}/100/100`, // Dynamic placeholder
      },
      streak: 0,
    };
  });

  const taskService = useMemo(() => {
    if (!isClient) return null; // TaskService might use localStorage or other client things implicitly via user object state or its own storage.
    return new TaskService(user); // Pass user to TaskService
  }, [user, isClient]);

  const [nudge, setNudge] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(() => {
     if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
      if (storedTasks) return JSON.parse(storedTasks);
    }
    return [];
  });
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
      { id: generateId(), name: "15 Min Guided Meditation", description: "Unlock a new meditation track.", pointsRequired: 50, isUnlocked: false, type: "virtual" },
      { id: generateId(), name: "Affirmation Pack", description: "Receive a pack of positive affirmations.", pointsRequired: 100, isUnlocked: false, type: "virtual" },
      { id: generateId(), name: "Stress-Relief eBook", description: "Get a free eBook on stress management.", pointsRequired: 200, isUnlocked: false, type: "real-world" },
    ];
  });

  // Load initial data from localStorage
  useEffect(() => {
    setIsClient(true); // Indicate client-side rendering
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

  // Persist data to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY_MOOD, JSON.stringify(moodLogs));
      localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasks));
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(LOCAL_STORAGE_KEY_REWARDS, JSON.stringify(rewards));
      localStorage.setItem(LOCAL_STORAGE_KEY_NEUROPOINTS, JSON.stringify(neuroPoints));
    }
  }, [moodLogs, tasks, user, rewards, neuroPoints, isClient]);


  // Initialize default tasks if none exist
  useEffect(() => {
    if (isClient && tasks.length === 0 && taskService) {
      const defaultTasks: Omit<Task, "id" | "isCompleted">[] = [
        { name: "10 min Meditation", description: "Practice mindfulness meditation.", rewardPoints: 10, hasNeuroBoost: true},
        { name: "30 min Exercise", description: "Engage in physical activity.", rewardPoints: 20, hasNeuroBoost: false},
        { name: "Read for 20 mins", description: "Read a book or article.", rewardPoints: 15, hasNeuroBoost: false},
        { name: "8 hours of Sleep", description: "Ensure adequate sleep.", rewardPoints: 20, hasNeuroBoost: false},
        { name: "Journal Thoughts", description: "Write down your thoughts for 10 mins.", rewardPoints: 10, hasNeuroBoost: true},
      ];
      const newTasks = defaultTasks.map(taskData => taskService.createTask(taskData));
      setTasks(newTasks);
    }
  }, [isClient, taskService]); // tasks.length removed to avoid loop if tasks are added

  // Update nudge and hormone levels
  useEffect(() => {
    if (isClient && tasks.length > 0) {
      const incompleteTasks = tasks.filter(t => !t.isCompleted);
      if (incompleteTasks.length > 0) {
        setNudge(getAICoachNudge(user, incompleteTasks[Math.floor(Math.random() * incompleteTasks.length)]));
      } else {
        setNudge(getAICoachNudge(user, null)); // General nudge if all tasks complete
      }
      setUser(prevUser => ({ ...prevUser, hormoneLevels: predictHormone(prevUser) }));
    }
  }, [tasks, user.name, isClient]); // user.name to re-evaluate nudge if user changes name.

  const handleLogMood = (newLog: MoodLog) => {
    setMoodLogs((prevLogs) =>
      [newLog, ...prevLogs].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    );
  };

  const addTask = (taskData: Omit<Task, "id" | "isCompleted">) => {
    if (taskService) {
      const newTask = taskService.createTask(taskData);
      setTasks((prevTasks) => [...prevTasks, newTask]);
    }
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
        streak: taskService.user.streak // Get updated streak from taskService's user instance
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
      // toast({ title: "Reward Claimed!", description: `You've unlocked ${rewardToClaim.name}.`});
    }
  };


  const existingDates = moodLogs.map((log) => log.date);

  if (!isClient) {
    // Optional: Return a loading skeleton for the whole page or critical parts
    return <div className="flex justify-center items-center min-h-screen"><Brain className="h-12 w-12 animate-pulse text-accent"/></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Left Column */}
          <section className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profile</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => alert("Edit profile clicked")}><Edit3 className="h-4 w-4"/></Button>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3">
                <AvatarDisplay avatar={user.avatar} size={100}/>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">Streak: {user.streak} days <Zap className="inline h-4 w-4 text-yellow-400" /></p>
                 <p className="text-lg font-bold text-accent">NeuroPoints: {neuroPoints} NP</p>
                {nudge && <p className="text-xs text-center p-2 bg-accent/10 rounded-md text-accent-foreground">{nudge}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Log Your Mood</CardTitle>
                <CardDescription>Track daily feelings and activities.</CardDescription>
              </CardHeader>
              <CardContent>
                <MoodLogForm onLogMood={handleLogMood} existingDates={existingDates} />
              </CardContent>
            </Card>
            
            <PersonalizedInsights moodLogs={moodLogs} />
          </section>

          {/* Right Column (Main Content) */}
          <section className="lg:col-span-2 space-y-6">
            <MoodChart moodLogs={moodLogs} />
            
            <Card>
              <CardHeader>
                <CardTitle>Hormone Levels</CardTitle>
                <CardDescription>Estimated based on your activities and mood.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><Brain className="inline h-5 w-5 mr-1 text-blue-500" />Dopamine: <span className="font-semibold">{user.hormoneLevels.dopamine}%</span></div>
                <div><Zap className="inline h-5 w-5 mr-1 text-red-500" />Adrenaline: <span className="font-semibold">{user.hormoneLevels.adrenaline}%</span></div>
                <div><Brain className="inline h-5 w-5 mr-1 text-orange-500" />Cortisol: <span className="font-semibold">{user.hormoneLevels.cortisol}%</span></div>
                <div><Brain className="inline h-5 w-5 mr-1 text-green-500" />Serotonin: <span className="font-semibold">{user.hormoneLevels.serotonin}%</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Daily Tasks</CardTitle>
                {/* <Button onClick={() => addTask({name: "New Custom Task", description:"A new task to do", rewardPoints: 5, hasNeuroBoost: false})} variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Task
                </Button> */}
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className={`p-3 border rounded-lg flex justify-between items-center ${task.isCompleted ? "bg-muted opacity-60" : "bg-card"}`}>
                      <div>
                        <h4 className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : "text-primary-foreground"}`}>{task.name}</h4>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                        <p className="text-xs mt-1">
                          Reward: <span className="font-semibold text-accent">{task.rewardPoints} NP</span>
                          {task.hasNeuroBoost && <span className="ml-1 text-xs text-yellow-500">(<Brain className="inline h-3 w-3"/> x10 Neuro Boost)</span>}
                        </p>
                      </div>
                      {!task.isCompleted && (
                        <Button onClick={() => handleTaskCompletion(task.id)} size="sm" variant="outline">
                          Complete
                        </Button>
                      )}
                    </div>
                  ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">No tasks for today. Add some to get started!</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mood History</CardTitle>
                <CardDescription>Review your past mood entries.</CardDescription>
              </CardHeader>
              <CardContent>
                {moodLogs.length > 0 ? (
                  <ScrollArea className="h-[250px] pr-4">
                    <div className="space-y-4">
                      {moodLogs.map((log) => (
                        <Card key={log.id} className="p-4 bg-card/80 hover:shadow-md transition-shadow">
                          <h3 className="font-semibold text-md text-primary-foreground">
                            {format(parseISO(log.date), "EEEE, MMMM d, yyyy")}
                          </h3>
                          <p className="text-sm text-foreground">
                            <strong className="font-medium">Mood:</strong> {log.mood}
                          </p>
                          {log.activities.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              <strong>Activities:</strong> {log.activities.join(", ")}
                            </p>
                          )}
                          {log.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              <strong>Notes:</strong> {log.notes}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    No mood logs yet. Start logging to see your history!
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
        
        {/* Full-width sections */}
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
      <footer className="text-center p-4 border-t border-border/50 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} NeuroSync Elite. Stay Mindful.</p>
      </footer>
    </div>
  );
}
