'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TaskSuggestionsInputSchema = z.object({
  moodLogs: z.array(z.object({
    date: z.string(),
    mood: z.string(),
    activities: z.array(z.string()),
    notes: z.string().optional(),
  })).describe('An array of mood logs.'),
  hormoneLevels: z.object({
    dopamine: z.number(),
    adrenaline: z.number(),
    cortisol: z.number(),
    serotonin: z.number(),
  }).describe('The user\'s current hormone levels.'),
  completedTasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    rewardPoints: z.number(),
    isCompleted: z.boolean(),
    hasNeuroBoost: z.boolean(),
  })).describe('The user\'s completed tasks.'),
});

export type TaskSuggestionsInput = z.infer<typeof TaskSuggestionsInputSchema>;

// This schema is used internally for the output definition
const SuggestedTaskSchema = z.object({
  name: z.string().describe('The name of the suggested task. Should be catchy and GenZ-friendly.'),
  description: z.string().describe('A brief, engaging description of the task, max 2 sentences. GenZ vibe.'),
  // rewardPoints will be calculated by the CalculateRewardPointsTool when the task is formally created
  hasNeuroBoost: z.boolean().describe('Whether the task should have a neuro-boost (true/false). Be creative!'),
});
export type SuggestedTask = z.infer<typeof SuggestedTaskSchema>;


const TaskSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedTaskSchema).describe('An array of suggested tasks with their details (name, description, hasNeuroBoost).'),
});
export type TaskSuggestionsOutput = z.infer<typeof TaskSuggestionsOutputSchema>;


export async function getTaskSuggestions(input: TaskSuggestionsInput): Promise<TaskSuggestionsOutput> {
  return taskSuggestionsFlow(input);
}

const taskSuggestionsFlow = ai.defineFlow(
  {
    name: 'taskSuggestionsFlow',
    inputSchema: TaskSuggestionsInputSchema,
    outputSchema: TaskSuggestionsOutputSchema,
  },
  async (input) => {
    const { output, finishReason, usage } = await ai.generate({
      prompt: `You are a fun, GenZ-style AI assistant helping a user find cool tasks to do.
      Based on the user's mood logs, hormone levels, and recently completed tasks, suggest 3 new tasks.
      Each task MUST have a "name", a "description", and a "hasNeuroBoost" (boolean) field.
      Make the tasks sound engaging and relevant to improving well-being or achieving small goals.
      The "name" should be short and catchy. The "description" should be 1-2 sentences.
      
      User's Mood Logs:
      {{#if moodLogs.length}}
      {{#each moodLogs}}
      - Date: {{this.date}}, Mood: {{this.mood}}, Activities: {{#if this.activities.length}}{{this.activities.join ', '}}{{else}}None{{/if}}{{#if this.notes}}, Notes: {{this.notes}}{{/if}}
      {{/each}}
      {{else}}
      No mood logs provided.
      {{/if}}

      User's Hormone Levels (0-100%):
      - Dopamine: {{hormoneLevels.dopamine}}%
      - Adrenaline: {{hormoneLevels.adrenaline}}%
      - Cortisol: {{hormoneLevels.cortisol}}%
      - Serotonin: {{hormoneLevels.serotonin}}%

      User's Recently Completed Tasks:
      {{#if completedTasks.length}}
      {{#each completedTasks}}
      - {{this.name}} ({{this.description}})
      {{/each}}
      {{else}}
      No tasks recently completed.
      {{/if}}

      Suggest 3 tasks now.
      The tasks MUST align with the app's GenZ wellness theme.
        Include tasks related to:
        - Mindfulness: activities that focus on being present and aware.
        - Social Connection: tasks that encourage interaction and bonding with others.
        - Physical Activity: any form of movement that gets the body going.
        - Creative Expression: activities that allow for creativity and imagination.
        - Learning: acquiring new skills or knowledge.
      Examples:
      - Mindfulness:
        - "Meditate with an app for 10 minutes." (hasNeuroBoost: true)
        - "Practice mindful breathing." (hasNeuroBoost: true)
        - "Take a digital detox hour." (hasNeuroBoost: true)
      - Social Connection:
        - "Call a friend to catch up." (hasNeuroBoost: false)
        - "Play a game online with friends." (hasNeuroBoost: false)
        - "Have a meal with family without phones." (hasNeuroBoost: false)
      - Physical Activity:
        - "Do a 15-minute workout video." (hasNeuroBoost: true)
        - "Go for a brisk walk in the park." (hasNeuroBoost: false)
        - "Dance to your favorite playlist for 20 minutes." (hasNeuroBoost: true)
      - Creative Expression:
        - "Sketch or doodle for 15 minutes." (hasNeuroBoost: true)
        - "Write a short poem." (hasNeuroBoost: true)
        - "Take some creative photos." (hasNeuroBoost: true)
      - Learning:
        - "Watch an educational video online." (hasNeuroBoost: true)
        - "Read a chapter of a book." (hasNeuroBoost: true)
        - "Listen to a podcast on a new topic." (hasNeuroBoost: true)
      `,
      model: 'googleai/gemini-2.0-flash',
      input: input, // Pass structured input directly to Handlebars template
      output: {
        schema: TaskSuggestionsOutputSchema, // Expect structured output
      },
      config: { 
        temperature: 0.7, // More creative suggestions
      }
    });

    if (finishReason !== 'stop' && finishReason !== 'length') {
        console.warn(`Task suggestion generation finished due to ${finishReason}. Output may be incomplete.`);
    }
    
    // The output is already validated by Genkit against TaskSuggestionsOutputSchema
    // If output is null or undefined, it means validation failed or generation failed.
    if (!output || !output.suggestions || output.suggestions.length === 0) {
      console.error("Failed to generate or parse AI response for task suggestions. Output:", output, "Usage:", usage);
      // Fallback if AI fails
      return { 
        suggestions: [
          { name: "Mindful Meditation", description: "Take 10 minutes to practice mindful meditation and center yourself.", hasNeuroBoost: true },
          { name: "Connect with a Friend", description: "Reach out to a friend and catch up. Good vibes only.", hasNeuroBoost: false },
          { name: "Stretch Break", description: "Spend 10 minutes stretching your body. Shake off that stiffness!", hasNeuroBoost: false },
          

        ]
      };
    }
    
    return output;
  }
);
