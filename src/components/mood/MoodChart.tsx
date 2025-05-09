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
import { CartesianGrid, XAxis, YAxis, LineChart, Line, ResponsiveContainer, Tooltip, Brush, ReferenceLine, Legend } from "recharts";
import { useMemo, useState } from "react";
import { format, parseISO, startOfWeek, endOfWeek, subWeeks, isSameDay, startOfDay } from "date-fns";

interface MoodChartProps {
  moodLogs: MoodLog[];
  width?: number;
  height?: number;
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
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return acc;
  }, {} as any),
};

export function MoodChart({ moodLogs, width = 800, height = 400 }: MoodChartProps) {
  const [view, setView] = useState<'daily' | 'weekly'>('daily'); // State for switching between daily and weekly

  // Function to switch between daily and weekly views
  const switchView = (newView: 'daily' | 'weekly') => {
    setView(newView);
  };

  const chartData = useMemo(() => {
    const logs = moodLogs.map(log => ({
        date: parseISO(log.date),
        displayDate: format(parseISO(log.date), "MMM dd"),
        weekStart: startOfWeek(parseISO(log.date), { weekStartsOn: 1 }), // Monday as the start of the week
        mood: log.mood,
        moodLevel: moodValueMapping[log.mood],
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (view === 'daily') {
      return logs;
    } else {
      // Weekly aggregation
      const weeklyData = logs.reduce((acc, curr) => {
        const weekKey = curr.weekStart.toISOString(); // Use week start as key
        if (!acc[weekKey]) {
          acc[weekKey] = {
            date: curr.weekStart,
            displayDate: `${format(curr.weekStart, "MMM dd")} - ${format(endOfWeek(curr.weekStart, { weekStartsOn: 1 }), "MMM dd")}`, // Display week range
            moodLevels: [],
          };
        }
        acc[weekKey].moodLevels.push(curr.moodLevel);
        return acc;
      }, {} as { [key: string]: { date: Date, displayDate: string, moodLevels: number[] } });

      return Object.values(weeklyData).map(week => ({
        date: week.date,
        displayDate: week.displayDate,
        moodLevel: week.moodLevels.reduce((a, b) => a + b, 0) / week.moodLevels.length, // Average mood level for the week
      }));
    }
  }, [moodLogs]);

  const domain = view === 'daily' ? [0, 5] : [0, 5];
  const ticks = view === 'daily' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5];
  const labelFormatter = (value: number) => {
    const moodName = Object.keys(moodValueMapping).find(key => moodValueMapping[key as keyof typeof moodValueMapping] === value);
    return moodName ? moodName.substring(0, 3) : value;
  }

  if (moodLogs.length === 0) {
    return (
      <Card className="w-full">
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
      <Card className="w-full">
        <CardHeader className="flex flex-col">
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
      <CardHeader className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col">
          <CardTitle>Mood Trends</CardTitle>
          <CardDescription>Your mood levels over time.</CardDescription>
        </div>
        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 rounded-md text-sm ${view === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            onClick={() => switchView('daily')}
          >
            Daily
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm ${view === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            onClick={() => switchView('weekly')}
          >
            Weekly
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height} >
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {/* Define the colors for the moods */}
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                {moodOptions.map((mood, index) => (
                  <stop
                    key={mood}
                    offset={`${index * (100 / (moodOptions.length - 1))}%`}
                    stopColor={`hsl(var(--chart-${(index % 5) + 1}))`}
                  />
                ))}
              </linearGradient>
            </defs>

            {/* Grid and Axis */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              height={60}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              domain={domain}
              ticks={ticks}
              tickFormatter={labelFormatter}
              label={{ value: 'Mood Level', angle: -90, position: 'insideLeft', offset: -10 }}
            />

            {/* Line and Tooltip */}
            <Line
              type="monotone"
              dataKey="moodLevel"
              stroke="url(#moodGradient)"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<ChartTooltipContent indicator="line" />}
            />
            
             {/* Add a brush for zooming and panning */}
             <Brush dataKey="displayDate" height={30} stroke="#8884d8" />
          
            {/*Legend */}
            <Legend verticalAlign="top" height={36} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
