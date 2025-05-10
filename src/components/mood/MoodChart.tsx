
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
  ...moodOptions.reduce((acc, mood, index) => { 
    acc[mood] = {
      label: mood,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return acc;
  }, {} as any),
};

export function MoodChart({ moodLogs, width = 800, height = 400 }: MoodChartProps) {
  const [view, setView] = useState<'daily' | 'weekly'>('daily');

  const switchView = (newView: 'daily' | 'weekly') => {
    setView(newView);
  };

  const chartData = useMemo(() => {
    const logs = moodLogs.map(log => ({
        date: parseISO(log.date),
        displayDate: format(parseISO(log.date), "MMM dd"),
        weekStart: startOfWeek(parseISO(log.date), { weekStartsOn: 1 }), 
        mood: log.mood,
        moodLevel: moodValueMapping[log.mood],
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (view === 'daily') {
      return logs;
    } else {
      const weeklyData = logs.reduce((acc, curr) => {
        const weekKey = curr.weekStart.toISOString(); 
        if (!acc[weekKey]) {
          acc[weekKey] = {
            date: curr.weekStart,
            displayDate: `${format(curr.weekStart, "MMM dd")} - ${format(endOfWeek(curr.weekStart, { weekStartsOn: 1 }), "MMM dd")}`,
            moodLevels: [],
          };
        }
        acc[weekKey].moodLevels.push(curr.moodLevel);
        return acc;
      }, {} as { [key: string]: { date: Date, displayDate: string, moodLevels: number[] } });

      return Object.values(weeklyData).map(week => ({
        date: week.date,
        displayDate: week.displayDate,
        moodLevel: week.moodLevels.reduce((a, b) => a + b, 0) / week.moodLevels.length, 
      }));
    }
  }, [moodLogs, view]); // Added view to dependencies

  const domain = view === 'daily' ? [0, 5] : [0, 5];
  const ticks = view === 'daily' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5];
  const labelFormatter = (value: number) => {
    const moodName = Object.keys(moodValueMapping).find(key => moodValueMapping[key as keyof typeof moodValueMapping] === value);
    return moodName ? moodName.substring(0, 3) : value.toString();
  }

  if (moodLogs.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle id="mood-trends-title-empty">Mood Trends</CardTitle>
          <CardDescription>Log your mood to see trends over time.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center" role="status" aria-labelledby="mood-trends-title-empty">
          <p className="text-muted-foreground">No mood data yet.</p>
        </CardContent>
      </Card>
    );
  } 

  if (moodLogs.length < 2) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-col">
          <CardTitle id="mood-trends-title-insufficient">Mood Trends</CardTitle>
          <CardDescription>Not enough data for a trend line. Keep logging!</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center" role="status" aria-labelledby="mood-trends-title-insufficient">
           <p className="text-muted-foreground">Log at least two moods to see trends.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col">
          <CardTitle id="mood-trends-title">Mood Trends</CardTitle>
          <CardDescription>Your mood levels over time.</CardDescription>
        </div>
        <div role="group" aria-label="Chart view period" className="flex items-center gap-2">
          <button
            className={`px-4 py-2 rounded-md text-sm ${view === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            onClick={() => switchView('daily')}
            aria-pressed={view === 'daily'}
            aria-label="Switch to daily view"
          >
            Daily
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm ${view === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            onClick={() => switchView('weekly')}
            aria-pressed={view === 'weekly'}
            aria-label="Switch to weekly view"
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
            aria-labelledby="mood-trends-title"
            role="figure"
          >
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
              aria-label="Date"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              domain={domain}
              ticks={ticks}
              tickFormatter={labelFormatter}
              label={{ value: 'Mood Level', angle: -90, position: 'insideLeft', offset: -10, 'aria-hidden': true }}
              aria-label="Mood Level"
            />

            <Line
              type="monotone"
              dataKey="moodLevel"
              stroke="url(#moodGradient)"
              strokeWidth={3}
              dot={{ r: 5, 'aria-hidden': true }}
              activeDot={{ r: 8, 'aria-hidden': true }}
              name="Mood Level"
              aria-label="Mood level trend line"
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<ChartTooltipContent indicator="line" />}
            />
            
             <Brush dataKey="displayDate" height={30} stroke="hsl(var(--primary))" aria-label="Time range selector"/>
          
            <Legend verticalAlign="top" height={36} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
