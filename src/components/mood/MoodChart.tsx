"use client";

import type { MoodLog } from "@/types/mood";
import { moodValueMapping, moodOptions } from "@/types/mood";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, LineChart, Line, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";

interface MoodChartProps {
  moodLogs: MoodLog[];
}

const chartConfig = {
  moodLevel: {
    label: "Mood Level",
    color: "hsl(var(--accent))",
  },
  // Add individual moods for potential bar chart or legend styling
  ...moodOptions.reduce((acc, mood, index) => {
    acc[mood] = {
      label: mood,
      color: `hsl(var(--chart-${(index % 5) + 1}))` 
    };
    return acc;
  }, {} as any)
};


export function MoodChart({ moodLogs }: MoodChartProps) {
  const chartData = useMemo(() => {
    return moodLogs
      .map(log => ({
        date: parseISO(log.date), // Keep as Date object for sorting
        displayDate: format(parseISO(log.date), "MMM d"),
        mood: log.mood,
        moodLevel: moodValueMapping[log.mood],
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date
  }, [moodLogs]);

  if (moodLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mood Trends</CardTitle>
          <CardDescription>Log your mood to see trends over time.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No mood data yet.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (moodLogs.length < 2) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Mood Trends</CardTitle>
          <CardDescription>Not enough data for a trend line. Keep logging!</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
           <p className="text-muted-foreground">Log at least two moods to see trends.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Trends</CardTitle>
        <CardDescription>Your mood levels over the past entries.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 20,
                left: -20, // Adjust to show Y-axis labels if needed
                bottom: 5,
              }}
              accessibilityLayer
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // interval={Math.max(0, Math.floor(chartData.length / 7) -1)} // Show limited ticks
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 5]} 
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(value) => {
                  // Find mood(s) that map to this value (could be multiple)
                  const moodName = Object.keys(moodValueMapping).find(key => moodValueMapping[key as keyof typeof moodValueMapping] === value);
                  return moodName ? moodName.substring(0,3) : value;
                }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                dataKey="moodLevel"
                type="monotone"
                stroke="var(--color-moodLevel)"
                strokeWidth={2}
                dot={{
                  fill: "var(--color-moodLevel)",
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
