'use server';

/**
 * @fileOverview Provides personalized insights and tips based on mood patterns.
 *
 * - getPersonalizedInsights - A function that analyzes mood logs and provides personalized insights.
 * - PersonalizedInsightsInput - The input type for the getPersonalizedInsights function.
 * - PersonalizedInsightsOutput - The return type for the getPersonalizedInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoodLogSchema = z.object({
  date: z.string().describe('The date of the mood log (YYYY-MM-DD).'),
  mood: z.string().describe('The mood recorded for the day (e.g., happy, sad, anxious).'),
  activities: z.array(z.string()).describe('The activities performed during the day.'),
  notes: z.string().optional().describe('Additional notes about the day.'),
});

const PersonalizedInsightsInputSchema = z.object({
  moodLogs: z.array(MoodLogSchema).describe('An array of mood logs.'),
});
export type PersonalizedInsightsInput = z.infer<typeof PersonalizedInsightsInputSchema>;

const InsightSchema = z.object({
  insight: z.string().describe('A personalized insight based on the mood logs.'),
  tip: z.string().describe('A practical tip to improve mood or well-being.'),
  relevanceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('A score indicating the relevance of the tip to the user (0-1).'),
});

const PersonalizedInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema).describe('An array of personalized insights and tips.'),
});
export type PersonalizedInsightsOutput = z.infer<typeof PersonalizedInsightsOutputSchema>;

const defaultInsightsOutput: PersonalizedInsightsOutput = {
    insights: [
        {
            insight: "Remember to stay hydrated, bestie! It's a total game changer for your vibe.",
            tip: "Carry a water bottle with you and take sips throughout the day.",
            relevanceScore: 0.6
        }
    ]
};

export async function getPersonalizedInsights(input: PersonalizedInsightsInput): Promise<PersonalizedInsightsOutput> {
  const parsedInput = PersonalizedInsightsInputSchema.safeParse(input);
  if (!parsedInput.success) {
    console.error("Invalid input for personalized insights:", parsedInput.error.flatten().fieldErrors);
    return defaultInsightsOutput; // Or throw, depending on how you want to handle in client
  }
  return personalizedInsightsFlow(parsedInput.data);
}

const RelevantSuggestionTool = ai.defineTool({
  name: 'isSuggestionRelevant',
  description: 'Determines if a given suggestion is relevant to the user based on their mood logs.',
  inputSchema: z.object({
    suggestion: z.string().describe('The suggestion to evaluate.'),
    moodLogs: z.array(MoodLogSchema).describe('The user mood logs to determine relevance.'),
  }),
  outputSchema: z.number().min(0).max(1).describe('A score (0-1) indicating the relevance of the suggestion.'),
},
async (input) => {
  // TODO: Implement an actual relevance determination logic here using a model or heuristic.
  // For now, return a dummy relevance score.
  // A real implementation could use the LLM to determine if the suggestion relates to the moodlogs
  // Could do some analysis like sentiment analysis to see if the suggestion matches the tonality of the moodlogs
  // To avoid making another call to the LLM, could load a different one.
  return 0.75; // Assume it's moderately relevant for now
});

const prompt = ai.definePrompt({
  name: 'personalizedInsightsPrompt',
  input: {schema: PersonalizedInsightsInputSchema},
  output: {schema: PersonalizedInsightsOutputSchema},
  tools: [RelevantSuggestionTool],
  prompt: `You are an AI wellness assistant that analyzes mood logs and provides personalized insights and tips to improve the user's mood and overall well-being.

  Analyze the following mood logs:
  {{#each moodLogs}}
  - Date: {{this.date}}, Mood: {{this.mood}}, Activities: {{this.activities}}, Notes: {{this.notes}}
  {{/each}}

  Based on these mood logs, provide personalized insights and tips. Use the isSuggestionRelevant tool to determine the relevance of each suggestion before including it in the final output.
  Consider patterns in mood, activities, and notes to generate relevant and helpful insights and tips. Only include insights and tips that are relevant to the user based on their mood logs, as determined by the relevance score from the isSuggestionRelevant tool.
  `,
});

const personalizedInsightsFlow = ai.defineFlow(
  {
    name: 'personalizedInsightsFlow',
    inputSchema: PersonalizedInsightsInputSchema,
    outputSchema: PersonalizedInsightsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output || !output.insights || output.insights.length === 0) {
        console.warn("Personalized insights generation resulted in no insights. Input:", input);
        return defaultInsightsOutput;
      }
      return output;
    } catch (error: any) {
      console.error("Error generating personalized insights:", error.message, "Input:", input);
      return defaultInsightsOutput; // Fallback to default insights on error
    }
  }
);

