"use client";

import type * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Smile, Frown, Meh, AlertCircle, Leaf, Zap, CloudLightning, Battery } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const moodLogSchema = z.object({
  date: z.date({
    required_error: "A date for the mood log is required.",
  }),
  mood: z.string().min(1, "Please select a mood."),
  activities: z.string().min(1, "Please list at least one activity."),
  notes: z.string().optional(),
});

type MoodLogFormValues = z.infer<typeof moodLogSchema>;

interface MoodLogFormProps {
  onLogMood: (log: MoodLog) => void;
  existingDates: string[]; // To disable already logged dates
}

const moodIcons: Record<Mood, React.ElementType> = {
  Happy: Smile,
  Sad: Frown,
  Neutral: Meh,
  Anxious: AlertCircle,
  Calm: Leaf,
  Energetic: Zap,
  Stressed: CloudLightning,
  Tired: Battery,
};

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

  function onSubmit(data: MoodLogFormValues) {
    const formattedDate = format(data.date, "yyyy-MM-dd");
    if (existingDates.includes(formattedDate)) {
      toast({
        title: "Date already logged",
        description: "You've already logged your mood for this date. Please choose another date or edit the existing log (feature coming soon!).",
        variant: "destructive",
      });
      return;
    }

    const newLog: MoodLog = {
      id: crypto.randomUUID(),
      date: formattedDate,
      mood: data.mood as Mood,
      activities: data.activities.split(",").map((activity) => activity.trim()).filter(activity => activity.length > 0),
      notes: data.notes,
    };
    onLogMood(newLog);
    toast({
      title: "Mood Logged!",
      description: `Your mood for ${format(data.date, "PPP")} has been saved.`,
    });
    // Reset form for next entry, maybe keep date or advance by one day? For now, simple reset.
    form.reset({ date: new Date(), mood: "", activities: "", notes: "" });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2000-01-01") || existingDates.includes(format(date, "yyyy-MM-dd"))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select the date for your mood entry.
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
              <FormLabel>Mood</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="How are you feeling?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {moodOptions.map((mood) => {
                    const IconComponent = moodIcons[mood];
                    return (
                      <SelectItem key={mood} value={mood}>
                        <div className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          {mood}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the mood that best describes how you felt.
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
              <FormLabel>Activities</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Morning walk, Met a friend, Worked on a project"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                List activities you did, separated by commas.
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional thoughts or details..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Log Mood</Button>
      </form>
    </Form>
  );
}
