
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Task } from '@/types/task'; // Assuming Task type is defined and matches this structure

// Input schema remains the same
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

// Updated output schema to expect richer task objects
const SuggestedTaskSchema = z.object({
  name: z.string().describe('The name of the suggested task. Should be catchy and GenZ-friendly.'),
  description: z.string().describe('A brief, engaging description of the task, max 2 sentences. GenZ vibe.'),
  rewardPoints: z.number().min(10).max(30).describe('Reward points for the task, between 10 and 30.'),
  hasNeuroBoost: z.boolean().describe('Whether the task should have a neuro-boost (true/false). Be creative!'),
});
export type SuggestedTask = z.infer<typeof SuggestedTaskSchema>;

const TaskSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedTaskSchema).describe('An array of suggested tasks with their details (name, description, rewardPoints, hasNeuroBoost).'),
});
export type TaskSuggestionsOutput = z.infer<typeof TaskSuggestionsOutputSchema>;


export async function getTaskSuggestions(input: TaskSuggestionsInput): Promise<TaskSuggestionsOutput> {
  // Direct invocation, no agent wrapping for this flow in this iteration.
  return taskSuggestionsFlow(input);
}


const taskSuggestionsFlow = ai.defineFlow(
  {
    name: 'taskSuggestionsFlow',
    inputSchema: TaskSuggestionsInputSchema,
    outputSchema: TaskSuggestionsOutputSchema, // Use the updated output schema
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      try {
        const { output, finishReason, usage } = await ai.generate({
          prompt: `You are a fun, GenZ-style AI assistant helping a user find cool tasks to do.
          Based on the user's mood logs, hormone levels, and recently completed tasks, suggest 2 to 3 new tasks.
          Each task MUST have a "name", a "description", "rewardPoints" (number between 10-30), and a "hasNeuroBoost" (boolean) field.
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

          Suggest 2 to 3 tasks now.
          The tasks MUST align with the app's GenZ wellness theme.
            Include tasks related to:
            - Mindfulness: activities that focus on being present and aware.
            - Social Connection: tasks that encourage interaction and bonding with others.
            - Physical Activity: any form of movement that gets the body going.
            - Creative Expression: activities that allow for creativity and imagination.
            - Learning: acquiring new skills or knowledge.
          Example Output Format (MUST be valid JSON array of objects):
          \`\`\`json
          [
            {
              "name": "Zen Zone Entry",
              "description": "Take 5 deep breaths and notice how you feel. Super simple W.",
              "rewardPoints": 15,
              "hasNeuroBoost": true
            },
            {
              "name": "Friend Vibe Check",
              "description": "Hit up a bestie and see how they're doing. Spread that good energy!",
              "rewardPoints": 20,
              "hasNeuroBoost": false
            }
          ]
          \`\`\`
          
          Provide the output as a JSON array of objects, each matching the structure: {"name": string, "description": string, "rewardPoints": number, "hasNeuroBoost": boolean}.
          Do NOT wrap the JSON array in any other JSON structure. Just the array itself.
          `,
          model: 'googleai/gemini-2.0-flash',
          input: input, 
          // We will parse the text output manually to fit TaskSuggestionsOutputSchema
          // as the model is asked to return a JSON array directly, not an object with a 'suggestions' key.
          output: { 
            format: 'text', // Expecting raw JSON string
          },
          config: { 
            temperature: 0.7, 
          }
        });

        if (finishReason !== 'stop' && finishReason !== 'length' && finishReason !== 'blocked') {
            console.warn(`Task suggestion generation finished due to ${finishReason}. Output may be incomplete.`);
        }
        
        let suggestions: SuggestedTask[] = [];
        if (output) {
          try {
            // The model is prompted to return a JSON array string directly.
            const parsedSuggestions = JSON.parse(output as string); 
            // Validate each item against SuggestedTaskSchema
            if (Array.isArray(parsedSuggestions)) {
              suggestions = parsedSuggestions.filter(item => SuggestedTaskSchema.safeParse(item).success);
            }
          } catch (e) {
            console.error("Failed to parse AI response for task suggestions. Raw output:", output, "Usage:", usage, "Error:", e);
          }
        }

        if (suggestions.length === 0) {
          console.error("No valid task suggestions parsed or generated. AI Output:", output, "Usage:", usage);
          // Provide a fallback if parsing fails or no suggestions are made
          return { 
            suggestions: [
              { name: "Mindful Meditation", description: "Take 10 minutes to practice mindful meditation and center yourself. #Zen", rewardPoints: 15, hasNeuroBoost: true },
              { name: "Connect with a Friend", description: "Reach out to a friend and catch up. Good vibes only. 🤙", rewardPoints: 20, hasNeuroBoost: false },
            ]
          };
        }
        
        return { suggestions }; // Wrap the parsed array in the expected output schema structure

      } catch (error: any) {
        attempts++;
        console.error(`Attempt ${attempts} failed for taskSuggestionsFlow: ${error.message}`);
        if (error.status === 'GEMINI_RESOURCE_EXHAUSTED' || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
          if (attempts < maxAttempts) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            console.error(`Max retry attempts (${maxAttempts}) reached. Giving up on AI suggestions.`);
            // Fallback to default suggestions after max retries
            return { 
              suggestions: [
                { name: "Default: Quick Sketch", description: "Doodle something for 5 mins. No pressure, just vibes.", rewardPoints: 10, hasNeuroBoost: true },
                { name: "Default: Gratitude Moment", description: "Think of one thing you're grateful for today.", rewardPoints: 10, hasNeuroBoost: false },
              ]
            };
          }
        } else {
           // For non-retryable errors, provide a fallback immediately.
           console.error("Non-retryable error in taskSuggestionsFlow. Providing fallback.");
           return { 
            suggestions: [
              { name: "Fallback: Hydration Check", description: "Sip some water, stay hydrated, queen/king!", rewardPoints: 10, hasNeuroBoost: false },
              { name: "Fallback: Screen Break", description: "Look away from your screen for 2 mins. Your eyes will thank you.", rewardPoints: 10, hasNeuroBoost: false },
            ]
          };
        }
      }
    }
    // This part should ideally not be reached if maxAttempts are exhausted and error is re-thrown or fallback provided.
    // Providing a final fallback if loop finishes without returning/throwing.
    console.error("Task suggestions flow exhausted attempts or had an unexpected exit.");
    return { 
      suggestions: [
        { name: "Ultimate Fallback: Vibe Check", description: "Take a deep breath. You're doing great!", rewardPoints: 10, hasNeuroBoost: true },
      ]
    };
  }
);
