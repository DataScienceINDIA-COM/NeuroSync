'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TaskSuggestionsInputSchema = z.object({
  moodLogs: z.array(z.object({
    date: z.string().describe("Date of the mood log (e.g., YYYY-MM-DD)"),
    mood: z.string().describe("The mood logged (e.g., Happy, Stressed)"),
    activities: z.array(z.string()).describe("List of activities for that day"),
    notes: z.string().optional().describe("Optional notes for the day"),
  })).min(1).describe('An array of mood logs, requiring at least one entry.'),
  hormoneLevels: z.object({
    dopamine: z.number(),
    adrenaline: z.number(),
    cortisol: z.number(),
    serotonin: z.number(),
  }).describe('The user\'s current estimated hormone levels.'),
  completedTasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    rewardPoints: z.number(),
    isCompleted: z.boolean(),
    hasNeuroBoost: z.boolean(),
  })).optional().describe('The user\'s recently completed tasks (optional).'),
});
export type TaskSuggestionsInput = z.infer<typeof TaskSuggestionsInputSchema>;

// Define the schema for a single suggested task detail
const SuggestedTaskDetailSchema = z.object({
  name: z.string().describe("The name of the suggested task."),
  description: z.string().describe("A brief description of the task. Keep it GenZ-friendly and encouraging!"),
  hasNeuroBoost: z.boolean().describe("Whether the task is likely to provide a significant mental/emotional boost (e.g., for VibePoints multiplier)."),
});
export type SuggestedTaskDetail = z.infer<typeof SuggestedTaskDetailSchema>;

// The output schema should be an object containing an array of these detailed suggestions
const TaskSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedTaskDetailSchema).describe('An array of 2-3 suggested task details (name, description, hasNeuroBoost).'),
});
export type TaskSuggestionsOutput = z.infer<typeof TaskSuggestionsOutputSchema>;

// The main exported function that calls the flow
export async function getTaskSuggestions(input: TaskSuggestionsInput): Promise<TaskSuggestionsOutput> {
  return getTaskSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'taskSuggestionsPrompt',
  input: { schema: TaskSuggestionsInputSchema },
  output: { schema: TaskSuggestionsOutputSchema },
  prompt: `You are a GenZ AI Vibe Coach for a wellness app. Your goal is to suggest 2-3 new, engaging tasks for the user.
These tasks should be fun, achievable, and promote well-being.
Consider the user's recent mood, hormone levels, and completed tasks to tailor your suggestions.
For each task, provide a "name" (short, catchy, GenZ style), a "description" (brief, motivating, using emojis ✨🚀💖💅), and whether it "hasNeuroBoost" (true/false - indicating if it's particularly good for a mental boost).

User's Recent Mood Logs:
{{#if moodLogs.length}}
  {{#each moodLogs}}
  - Mood: {{mood}} on {{date}}. Activities: {{#if activities.length}}{{join activities ", "}}{{else}}None{{/if}}. Notes: {{notes}}
  {{/each}}
{{else}}
  No recent mood logs provided. Suggest general wellness tasks.
{{/if}}

User's Current Hormone Levels:
  Dopamine: {{hormoneLevels.dopamine}}
  Adrenaline: {{hormoneLevels.adrenaline}}
  Cortisol: {{hormoneLevels.cortisol}}
  Serotonin: {{hormoneLevels.serotonin}}

User's Recently Completed Tasks (if any, to avoid repetition):
{{#if completedTasks.length}}
  {{#each completedTasks}}
  - {{name}}
  {{/each}}
{{else}}
  No recently completed tasks to consider for avoiding repetition.
{{/if}}

Generate tasks related to mindfulness, physical activity, creativity, social connection, or learning.
Output a JSON object matching the output schema, containing an array named "suggestions".
Example of a single suggestion object in the array:
{ "name": "15 Min Vibe Refocus 🧘‍♀️", "description": "Quick meditation to get your head in the game. Slay that stress! #MindfulVibes", "hasNeuroBoost": true }
`,
});

const getTaskSuggestionsFlow = ai.defineFlow(
  {
    name: 'getTaskSuggestionsFlow',
    inputSchema: TaskSuggestionsInputSchema,
    outputSchema: TaskSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output || !output.suggestions || output.suggestions.length === 0) {
      console.warn("AI task suggestion flow returned no suggestions or failed. Using fallback.");
      // Fallback if AI fails to generate or returns empty array
      return {
        suggestions: [
          { name: "10 Min Zen Reset ✨", description: "Quick mindfulness sesh. Calm the chaos, fam.", hasNeuroBoost: true },
          { name: "Vibe Walk (20m) 🚶‍♀️", description: "Fresh air, fresh thoughts. Get those steps in, bestie!", hasNeuroBoost: false },
          { name: "Doodle Break 🎨", description: "Unleash your inner artist for 15 mins. No rules, just vibes!", hasNeuroBoost: true },
        ]
      };
    }
    return output;
  }
);
