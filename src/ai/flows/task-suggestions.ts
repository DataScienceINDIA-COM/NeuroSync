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
          { name: "15 Min Mindful Moment", description: "Pause and practice mindfulness for 15 minutes. Issa vibe check for your brain.", hasNeuroBoost: true },
          { name: "Quick Energy Burst Walk", description: "Take a brisk 10-minute walk to boost energy. Get those steps in, bestie!", hasNeuroBoost: false },
          { name: "Reflect & Journal Sesh", description: "Spend 10 minutes journaling your thoughts and feelings. Spill the tea to yourself.", hasNeuroBoost: true }
        ]
      };
    }
    
    return output;
  }
);
