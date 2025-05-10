
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Mood, MoodLog } from "@/types/mood";
import { moodOptions } from "@/types/mood";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// Removed MoodLogsProvider, useMoodLogs from here, as it should be provided higher up
// and MoodLogForm should consume it via useMoodLogs directly or get addMoodLog via props

const moodLogSchema = z.object({
  date: z.date({
    required_error: "A date for the vibe log is required.",
  }),
  mood: z.string().min(1, "Gotta pick a mood! Spill."),
  activities: z.string().min(1, "What'd you get up to? Drop the deets."),
  notes: z.string().optional(),
});

const moodEmojiMap: Record<Mood, string> = {
  Happy: "😄", Sad: "😢", Neutral: "😐", Anxious: "😟", Calm: "😌", Energetic: "⚡", Stressed: "🤯", Tired: "😴",
};

type MoodLogFormValues = z.infer<typeof moodLogSchema>;


interface MoodLogFormProps {
  onLogMood: (logData: Omit<MoodLog, 'id'>) => void;
  existingDates: string[];
}



export function MoodLogForm({ onLogMood, existingDates }: MoodLogFormProps) {
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<MoodLogFormValues>({
    resolver: zodResolver(moodLogSchema),
    defaultValues: {
      date: new Date(),
      mood: "",
      activities: "",
      notes: "",
    },
  });
  const moodOptionColors: Record<Mood, string> = {
    Happy: "bg-yellow-400 hover:bg-yellow-500", 
    Sad: "bg-blue-400 hover:bg-blue-500", 
    Neutral: "bg-gray-400 hover:bg-gray-500", 
    Anxious: "bg-orange-500 hover:bg-orange-600", 
    Calm: "bg-green-400 hover:bg-green-500", 
    Energetic: "bg-purple-400 hover:bg-purple-500", 
    Stressed: "bg-red-500 hover:bg-red-600", 
    Tired: "bg-indigo-400 hover:bg-indigo-500", 
  };

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const handleMoodSelect = (mood: Mood) => {
    form.setValue("mood", mood);
    setSelectedMood(mood);
  };


  function onSubmit(data: MoodLogFormValues) {
    const formattedDate = format(data.date, "yyyy-MM-dd");
    if (existingDates.includes(formattedDate)) {
      toast({
        title: "Hold Up, Fam! 🚫", 
        description: "Looks like you already logged this day's vibe. Try another date or edit later (soon™). No cap. 😉", 
        variant: "destructive",
      });
      return;
    }

    const newLogData: Omit<MoodLog, 'id'> = { 
      date: formattedDate,
      mood: data.mood as Mood,
      activities: data.activities.split(",").map((activity) => activity.trim()).filter(activity => activity.length > 0),
      notes: data.notes,
    };
    onLogMood(newLogData); 
    toast({
      title: "Vibe Secured! ✨💅", 
      description: `Your mood for ${format(data.date, "PPP")} is locked in. Period. 🔒`, 
    });
    form.reset({ date: new Date(), mood: "", activities: "", notes: "" });
    setSelectedMood(null);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="font-semibold text-primary">Date Check 🗓️</FormLabel>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal hover:bg-accent/10 shadow-sm border-border focus:ring-2 focus:ring-primary",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Peep a date 👀</span> 
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card shadow-xl rounded-lg border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) field.onChange(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2000-01-01") || existingDates.includes(format(date, "yyyy-MM-dd"))
                    }
                    initialFocus
                    className="[&_button]:rounded-md [&_button:hover]:bg-accent/20 [&_button[aria-selected]]:bg-primary [&_button[aria-selected]]:text-primary-foreground"
                  />
                </PopoverContent>
              </Popover>
              <FormDescription className="text-xs text-muted-foreground">
                When was this vibe hitting? Pick a day, any day (almost).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        
        <FormField
          control={form.control}
          name="mood"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-primary">Current Vibe Check? 🤔</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {moodOptions.map((mood) => {
                    const isSelected = field.value === mood;
                    const moodColor = moodOptionColors[mood as Mood] || "bg-gray-300 hover:bg-gray-400";
                    const emoji = moodEmojiMap[mood as Mood] || "❓";

                    return (
                      <motion.div
                        key={mood}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          type="button"
                          onClick={() => handleMoodSelect(mood as Mood)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg shadow-md transition-all duration-200 ease-in-out w-full aspect-square text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                            moodColor,
                            isSelected ? "ring-4 ring-accent ring-offset-background shadow-xl scale-105" : "hover:shadow-lg"
                          )}
                          aria-pressed={isSelected}
                        >
                          <span className="text-3xl sm:text-4xl">{emoji}</span>
                          <span className="text-xs sm:text-sm mt-1 truncate">{mood}</span>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                Pick your current energy. Keep it 💯.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}

        />

        <FormField
          control={form.control}
          name="activities"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-primary">Activity Recap 📝</FormLabel> 
              <FormControl>
                <Textarea
                  placeholder="e.g., Chilled with the squad, aced that test, gaming glow-up" 
                  className="focus:bg-background shadow-sm border-border focus:ring-2 focus:ring-primary min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                What'd you get up to? (comma sep, if you're feeling it)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-primary">Extra Tea? (Low key optional 🍵)</FormLabel> 
              <FormControl>
                <Textarea
                  placeholder="Spill any extra deets or thoughts here..." 
                  className="focus:bg-background shadow-sm border-border focus:ring-2 focus:ring-primary min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full font-bold text-lg py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95">
          <Wand2 className="mr-2 h-5 w-5" />
          Log That Vibe! 🚀
        </Button>
      </form>
    </Form>
  );
}

