'use server';
/**
 * @fileOverview Generates community challenges based on user mood data.
 *
 * - generateCommunityChallenges - A function that creates community challenges.
 * - Challenge - The type definition for a community challenge.
 * - GenerateCommunityChallengesInput - The input type for the challenge generation flow.
 * - GenerateCommunityChallengesOutput - The output type for the challenge generation flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChallengeSchema = z.object({
  title: z.string().describe('The catchy title of the challenge.'),
  description: z.string().describe('A brief, engaging description of what the challenge entails.'),
  category: z.string().describe('A category for the challenge (e.g., mindfulness, activity, connection, creativity, positivity).'),
});
export type Challenge = z.infer<typeof ChallengeSchema>;

const GenerateCommunityChallengesInputSchema = z.object({
  recentMoods: z.array(z.object({
    date: z.string().describe('The date of the mood log (YYYY-MM-DD).'),
    mood: z.string().describe('The logged mood (e.g., Happy, Stressed, Calm).'),
  })).describe('An array of recent mood logs, max 5-7. Used to tailor challenges to current community vibe.'),
});
export type GenerateCommunityChallengesInput = z.infer<typeof GenerateCommunityChallengesInputSchema>;

const GenerateCommunityChallengesOutputSchema = z.object({
  challenges: z.array(ChallengeSchema).describe('An array of 1-3 generated community challenges.'),
});
export type GenerateCommunityChallengesOutput = z.infer<typeof GenerateCommunityChallengesOutputSchema>;

export async function generateCommunityChallenges(input: GenerateCommunityChallengesInput): Promise<GenerateCommunityChallengesOutput> {
  return generateCommunityChallengesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommunityChallengesPrompt',
  input: { schema: GenerateCommunityChallengesInputSchema },
  output: { schema: GenerateCommunityChallengesOutputSchema },
  prompt: `You are an AI assistant for a GenZ wellness app called Vibe Check. Your task is to generate 1 to 3 engaging community challenges.
These challenges should be fun, positive, and encourage well-being.
Consider the overall recent moods of the community to tailor the challenges. For example, if many users are stressed, suggest calming or stress-relief challenges. If users are energetic, suggest active or creative challenges.

Recent Community Moods:
{{#if recentMoods.length}}
  {{#each recentMoods}}
  - Mood: {{mood}} on {{date}}
  {{/each}}
{{else}}
  No specific recent mood data available. Generate general wellness challenges.
{{/if}}

Generate challenges that fit into categories like: mindfulness, physical activity, social connection, creativity, or acts of kindness.
Ensure the output is a JSON object matching the output schema, containing an array named "challenges". Each challenge object should have "title", "description", and "category".
Keep descriptions concise and engaging for a GenZ audience. Use relevant emojis. ✨🚀💖💅🎯😉🤩
Example Challenge Object:
{
  "title": "Zen Zone Moment 🧘‍♀️",
  "description": "Take 5 mins today for a quick meditation or deep breathing. Share how it made you feel! #MindfulVibes",
  "category": "mindfulness"
}
`,
});

const generateCommunityChallengesFlow = ai.defineFlow(
  {
    name: 'generateCommunityChallengesFlow',
    inputSchema: GenerateCommunityChallengesInputSchema,
    outputSchema: GenerateCommunityChallengesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.challenges || output.challenges.length === 0) {
      // Fallback if AI fails to generate or returns empty array
      return {
        challenges: [
          { title: "Spread Positivity ✨", description: "Share a compliment or a positive thought with someone today!", category: "kindness" },
          { title: "Quick Vibe Check-in 📝", description: "Log your mood and one thing you're grateful for right now.", category: "mindfulness" },
        ]
      };
    }
    return output;
  }
);
