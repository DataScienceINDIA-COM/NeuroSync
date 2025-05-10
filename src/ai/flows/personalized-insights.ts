
'use server';
/**
 * @fileOverview Provides personalized insights based on user's mood and activity.
 * - getPersonalizedInsights - A function that handles the insight generation.
 * - PersonalizedInsightsInput - The input type for the getPersonalizedInsights function.
 * - PersonalizedInsightsOutput - The return type for the getPersonalizedInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedInsightSchema = z.object({
  insight: z.string().describe("The actual insight text."),
  tip: z.string().describe("An actionable tip related to the insight."),
  relevanceScore: z.number().min(0).max(1).describe("A score from 0.0 to 1.0 indicating how relevant this insight is, based on the data."),
});

const PersonalizedInsightsInputSchema = z.object({
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
  // Optional: Could add user preferences or goals here in the future
  // userPreferences: z.object({ preferredActivityTypes: z.array(z.string()) }).optional(),
});
export type PersonalizedInsightsInput = z.infer<typeof PersonalizedInsightsInputSchema>;

const PersonalizedInsightsOutputSchema = z.object({
  insights: z.array(PersonalizedInsightSchema).describe('An array of 1-3 personalized insights and tips.'),
});
export type PersonalizedInsightsOutput = z.infer<typeof PersonalizedInsightsOutputSchema>;

const insightsPrompt = ai.definePrompt(
  {
    name: 'personalizedInsightsPrompt',
    input: { schema: PersonalizedInsightsInputSchema },
    output: { schema: PersonalizedInsightsOutputSchema },
    prompt: `You are a GenZ AI wellness coach called VibeCheck AI. Your goal is to provide supportive, actionable, and slightly cheeky insights based on mood logs.
    Analyze the user's mood patterns, activities, and notes.
    Provide 1-3 concise insights. Each insight should have a 'relevanceScore' (0.0 to 1.0).
    Frame insights positively or constructively. Use GenZ slang appropriately (e.g., "low key", "no cap", "vibe", "period.", "slay").
    User's Mood Logs:
    {{#each moodLogs}}
    - Date: {{date}}, Mood: {{mood}}, Activities: {{#if activities.length}}{{join activities ", "}}{{else}}None{{/if}}{{#if notes}}, Notes: "{{notes}}"{{/if}}
    {{/each}}
    Consider their hormone levels for context: {{jsonStringify hormoneLevels}}.
    Focus on patterns, correlations between activities/moods, or suggestions for improvement.
    Output a JSON object matching the schema. Be real with 'em, but keep it positive. ✨💅 Period.`,
  }
);

const personalizedInsightsFlow = ai.defineFlow(
  {
    name: 'personalizedInsightsFlow',
    inputSchema: PersonalizedInsightsInputSchema,
    outputSchema: PersonalizedInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await insightsPrompt(input);
    if (!output || !output.insights || output.insights.length === 0) {
      // Fallback if AI fails to generate or returns empty array
      return {
        insights: [
          { insight: "No specific tea from the AI rn, fam.", tip: "Keep logging those vibes, and we'll cook up something fire soon! 🔥", relevanceScore: 0.5 }
        ]
      };
    }
    return output;
  }
);

export async function getPersonalizedInsights(input: PersonalizedInsightsInput): Promise<PersonalizedInsightsOutput> {
  // Add basic validation if needed, or rely on Zod schema in the flow
  if (!input.moodLogs || input.moodLogs.length === 0) {
    console.warn("getPersonalizedInsights called with no mood logs.");
    return {
        insights: [
            { insight: "Log some vibes first, bestie!", tip: "We need your mood tea to spill the AI tea. 🍵", relevanceScore: 0.1 }
        ]
    };
  }
  return personalizedInsightsFlow(input);
}
