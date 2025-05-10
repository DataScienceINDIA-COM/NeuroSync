'use server';
/**
 * @fileOverview Recommends content based on user mood, activities, and hormone levels.
 *
 * - getRecommendedContent - A function that handles content recommendation.
 * - RecommendedContentInput - The input type for the getRecommendedContent function.
 * - RecommendedContentOutput - The return type for the getRecommendedContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// List of available content titles for the AI to choose from
const AVAILABLE_CONTENT_TITLES = [
  "Understanding Dopamine: The Motivation Molecule",
  "10-Minute Guided Meditation for Stress Relief",
  "The Science of Energy & Focus with Dr. Andrew Huberman",
  "Serotonin: Functions, Normal Range, Side Effects, and More",
  "How to Manage Adrenaline for Better Performance"
];

const RecommendedContentInputSchema = z.object({
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
  activities: z.array(z.string()).describe('The user\'s recent activities or completed tasks.'),
});
export type RecommendedContentInput = z.infer<typeof RecommendedContentInputSchema>;

const RecommendedContentOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('An array of 1-3 recommended content titles chosen from the provided list.'),
});
export type RecommendedContentOutput = z.infer<typeof RecommendedContentOutputSchema>;


const recommendationPrompt = ai.definePrompt({
  name: 'recommendContentPrompt',
  input: { schema: RecommendedContentInputSchema },
  output: { schema: RecommendedContentOutputSchema },
  prompt: `You are a wellness content curator for a GenZ app called Vibe Check.
Your task is to recommend 1 to 3 relevant content titles to the user.
The recommendations MUST be chosen ONLY from the following list of available titles:
{{#each availableContentTitles}}
- {{{this}}}
{{/each}}

Analyze the user's recent mood logs, activities, and hormone levels to make your selections.
Prioritize content that seems most relevant to their current state or recent experiences.
Output a JSON object matching the schema, containing an array named "recommendations" with the chosen titles.

User's Recent Mood Logs:
{{#if moodLogs.length}}
  {{#each moodLogs}}
  - Date: {{date}}, Mood: {{mood}}, Activities: {{#if activities.length}}{{join activities ", "}}{{else}}None{{/if}}{{#if notes}}, Notes: "{{notes}}"{{/if}}
  {{/each}}
{{else}}
  No recent mood logs provided.
{{/if}}

User's Current Hormone Levels:
  Dopamine: {{hormoneLevels.dopamine}}
  Adrenaline: {{hormoneLevels.adrenaline}}
  Cortisol: {{hormoneLevels.cortisol}}
  Serotonin: {{hormoneLevels.serotonin}}

User's Recent Activities/Tasks:
{{#if activities.length}}
  {{#each activities}}
  - {{{this}}}
  {{/each}}
{{else}}
  No recent activities provided.
{{/if}}
`,
});

const getRecommendedContentFlow = ai.defineFlow(
  {
    name: 'getRecommendedContentFlow',
    inputSchema: RecommendedContentInputSchema,
    outputSchema: RecommendedContentOutputSchema,
  },
  async (input) => {
    // Pass the list of available content titles to the prompt context
    const { output } = await recommendationPrompt({
      ...input,
      availableContentTitles: AVAILABLE_CONTENT_TITLES,
    });

    if (!output || !output.recommendations || output.recommendations.length === 0) {
      // Fallback if AI fails to generate or returns empty array
      // Pick 1-2 random items from the available list as a fallback
      const shuffled = AVAILABLE_CONTENT_TITLES.sort(() => 0.5 - Math.random());
      return { recommendations: shuffled.slice(0, Math.min(2, shuffled.length)) };
    }
    // Ensure AI recommendations are valid titles from the list
    const validRecommendations = output.recommendations.filter(rec => AVAILABLE_CONTENT_TITLES.includes(rec));
    if (validRecommendations.length === 0) {
        const shuffled = AVAILABLE_CONTENT_TITLES.sort(() => 0.5 - Math.random());
        return { recommendations: shuffled.slice(0, Math.min(2, shuffled.length)) };
    }
    return { recommendations: validRecommendations };
  }
);

// Exported wrapper function to call the flow
export async function getRecommendedContent(input: RecommendedContentInput): Promise<RecommendedContentOutput> {
  if (!input.moodLogs || input.moodLogs.length === 0) {
    console.warn("getRecommendedContent called with no mood logs. Returning default recommendations.");
    const shuffled = AVAILABLE_CONTENT_TITLES.sort(() => 0.5 - Math.random());
    return { recommendations: shuffled.slice(0, Math.min(2, shuffled.length)) };
  }
  return getRecommendedContentFlow(input);
}
