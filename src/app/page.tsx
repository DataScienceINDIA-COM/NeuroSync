"use client";

import { useEffect, useState } from "react";
import type { MoodLog } from "@/types/mood";
import { Header } from "@/components/Header";
import { MoodLogForm } from "@/components/mood/MoodLogForm";
import { MoodChart } from "@/components/mood/MoodChart";
import { PersonalizedInsights } from "@/components/mood/PersonalizedInsights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";

const LOCAL_STORAGE_KEY = "moodBalanceLogs";

export default function HomePage() {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedLogs = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedLogs) {
      try {
        const parsedLogs = JSON.parse(storedLogs) as MoodLog[];
        // Validate logs structure if necessary
        setMoodLogs(parsedLogs.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
      } catch (error) {
        console.error("Failed to parse mood logs from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(moodLogs));
    }
  }, [moodLogs, isClient]);

  const handleLogMood = (newLog: MoodLog) => {
    setMoodLogs(prevLogs => [newLog, ...prevLogs].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
  };
  
  const existingDates = moodLogs.map(log => log.date);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <section className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Log Your Mood</CardTitle>
                <CardDescription>Track your daily feelings and activities.</CardDescription>
              </CardHeader>
              <CardContent>
                {isClient ? (
                     <MoodLogForm onLogMood={handleLogMood} existingDates={existingDates} />
                ) : (
                    <p>Loading form...</p> // Or a skeleton loader
                )}
              </CardContent>
            </Card>
            
            {isClient && (
                 <PersonalizedInsights moodLogs={moodLogs} />
            )}
          </section>

          <section className="lg:col-span-2 space-y-6">
            {isClient && <MoodChart moodLogs={moodLogs} />}
            
            <Card>
              <CardHeader>
                <CardTitle>Mood History</CardTitle>
                <CardDescription>Review your past mood entries.</CardDescription>
              </CardHeader>
              <CardContent>
                {isClient && moodLogs.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {moodLogs.map((log) => (
                        <div key={log.id} className="p-4 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                          <h3 className="font-semibold text-lg text-primary-foreground">
                            {format(parseISO(log.date), "EEEE, MMMM d, yyyy")}
                          </h3>
                          <p className="text-foreground"><strong className="font-medium">Mood:</strong> {log.mood}</p>
                          {log.activities.length > 0 && (
                            <p className="text-muted-foreground"><strong className="font-medium">Activities:</strong> {log.activities.join(", ")}</p>
                          )}
                          {log.notes && <p className="text-sm text-muted-foreground mt-1"><strong className="font-medium">Notes:</strong> {log.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    {isClient ? "No mood logs yet. Start logging to see your history!" : "Loading history..."}
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <footer className="text-center p-4 border-t border-border/50 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Mood Balance. Stay Mindful.</p>
      </footer>
    </div>
  );
}
