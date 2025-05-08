"use client";

import type * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Smile, Frown, Meh, AlertCircle, Leaf, Zap, CloudLightning, Battery, Wand2 } from "lucide-react";

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
import { Input } from "@/components/ui/input"; // Not used, but kept for consistency if needed later
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
    required_error: "A date for the vibe log is required.",
  }),
  mood: z.string().min(1, "Gotta pick a mood! Spill."),
  activities: z.string().min(1, "What'd you get up to? Drop the deets."),
  notes: z.string().optional(),
});

type MoodLogFormValues = z.infer<typeof moodLogSchema>;

interface MoodLogFormProps {
  onLogMood: (log: MoodLog) => void;
  existingDates: string[]; 
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
        title: "Hold Up, Fam!", // GenZ
        description: "Looks like you already logged this day's vibe. Try another date or edit later (soon™). No cap.", // GenZ
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
      title: "Vibe Secured! ✨💅", // GenZ
      description: `Your mood for ${format(data.date, "PPP")} is locked in. Period.`, // GenZ
    });
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
              <FormLabel>Date Check</FormLabel>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal hover:bg-accent/10",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Peep a date</span> 
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
                When was this vibe hitting?
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
              <FormLabel>Current Vibe Status</FormLabel> {/* GenZ */}
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="hover:bg-accent/10">
                    <SelectValue placeholder="What's the energy saying?" /> {/* GenZ */}
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
              <FormLabel>Activity Recap</FormLabel> {/* GenZ */}
              <FormControl>
                <Textarea
                  placeholder="e.g., Chilled with the squad, aced that test, gaming glow-up" // GenZ
                  className="focus:bg-background"
                  {...field}
                />
              </FormControl>
              <FormDescription>
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
              <FormLabel>Extra Tea? (Low key optional)</FormLabel> {/* GenZ */}
              <FormControl>
                <Textarea
                  placeholder="Spill any extra deets or thoughts here..." // GenZ
                  className="focus:bg-background"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
            <Wand2 className="mr-2 h-4 w-4"/>
            Log That Vibe! {/* GenZ */}
        </Button>
      </form>
    </Form>
  );
}
