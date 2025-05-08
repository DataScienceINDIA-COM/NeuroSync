
'use server';
/**
 * @fileOverview Generates community challenges based on recent mood data.
 *
 * - generateCommunityChallenges - A function that generates challenge ideas.
 * - GenerateCommunityChallengesInput - The input type for the generateCommunityChallenges function.
 * - GenerateCommunityChallengesOutput - The return type for the generateCommunityChallenges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoodLogEntrySchema = z.object({
  date: z.string().describe('The date of the mood log (YYYY-MM-DD).'),
  mood: z.string().describe('The mood recorded for the day (e.g., happy, sad, anxious).'),
});

const GenerateCommunityChallengesInputSchema = z.object({
  recentMoods: z.array(MoodLogEntrySchema).min(1).describe('An array of recent mood log entries for context.'),
  // We could add other inputs like popular activities, trending topics in the community, etc.
});
export type GenerateCommunityChallengesInput = z.infer<typeof GenerateCommunityChallengesInputSchema>;

const ChallengeSchema = z.object({
  title: z.string().describe('A short, catchy title for the challenge. GenZ vibe, please!'),
  description: z.string().describe('A brief, engaging description of the challenge (1-2 sentences). Make it fun!'),
  category: z.enum(['mindfulness', 'activity', 'creativity', 'connection', 'positivity']).describe('The category of the challenge.'),
});
export type Challenge = z.infer<typeof ChallengeSchema>;

const GenerateCommunityChallengesOutputSchema = z.object({
  challenges: z.array(ChallengeSchema).min(1).max(3).describe('An array of 1 to 3 suggested community challenges.'),
});
export type GenerateCommunityChallengesOutput = z.infer<typeof GenerateCommunityChallengesOutputSchema>;

export async function generateCommunityChallenges(input: GenerateCommunityChallengesInput): Promise<GenerateCommunityChallengesOutput> {
  // Input validation could be done here too, though Genkit flow will also validate
  const parsedInput = GenerateCommunityChallengesInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const errorMessage = parsedInput.error.issues.map(issue => issue.message).join(' ');
    throw new Error(errorMessage || 'Invalid input for challenge generation.');
  }
  return generateCommunityChallengesFlow(parsedInput.data);
}

const generateCommunityChallengesFlow = ai.defineFlow(
  {
    name: 'generateCommunityChallengesFlow',
    inputSchema: GenerateCommunityChallengesInputSchema,
    outputSchema: GenerateCommunityChallengesOutputSchema,
  },
  async (input) => {
    const { output, finishReason } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `You are a super cool AI assistant, a total vibe curator for a GenZ wellness app.
      Your job is to come up with fun community challenges that match the recent mood of our users.
      Make the challenges engaging, positive, and something that encourages interaction or personal growth.
      Think about what someone might enjoy or benefit from based on their recent vibes.

      Recent User Moods (last few entries):
      {{#each recentMoods}}
      - On {{this.date}}, they felt {{this.mood}}.
      {{/each}}

      Based on these moods, suggest 1 to 3 community challenges.
      Each challenge needs a 'title', 'description', and 'category' (mindfulness, activity, creativity, connection, positivity).
      Keep the titles short and catchy. Descriptions should be 1-2 sentences, super engaging.
      Let's make these challenges something people actually want to do!

      Example ideas (don't just copy these!):
      - If moods are "Stressed" or "Anxious":
        - Title: "Zen Zone Check-in"
        - Description: "Share one small thing that brought you peace today. Let's find calm together! ✨"
        - Category: mindfulness
      - If moods are "Happy" or "Energetic":
        - Title: "Good Vibes Only Photo Drop"
        - Description: "Snap a pic of something that made you smile today and share it! Spread the joy! 📸"
        - Category: positivity
      - If moods are "Tired" or "Sad":
        - Title: "Self-Care Sunday (Any Day!)"
        - Description: "What's one act of self-care you're doing for yourself this week? Inspire the squad! 💖"
        - Category: mindfulness

      Provide the output as a JSON object matching the defined schema.
      `,
      input: input,
      output: {
        schema: GenerateCommunityChallengesOutputSchema,
      },
      config: {
        temperature: 0.8, // A bit more creative for challenges
      },
    });

    if (finishReason !== 'stop' && finishReason !== 'length' && finishReason !== 'blocked') {
      console.warn(`Challenge generation finished due to ${finishReason}. Output may be incomplete or fallback needed.`);
    }

    if (!output || !output.challenges || output.challenges.length === 0) {
      console.error("AI failed to generate challenges or parse them. Output:", output);
      // Fallback if AI fails or returns empty/malformed
      return {
        challenges: [
          { title: "Mindful Moment Share", description: "Take 5 minutes to just breathe. Share how it felt! 🧘‍♀️", category: "mindfulness" },
          { title: "Quick Wins Wednesday", description: "What's one small thing you crushed today? Big or small, let's hear it! 🏆", category: "positivity" },
        ]
      };
    }

    return output;
  }
);
