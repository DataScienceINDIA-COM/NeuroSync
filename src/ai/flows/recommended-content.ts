'use server';
/**
 * @fileOverview Provides recommended content titles based on user's mood, activities, and hormone levels.
 *
 * - getRecommendedContent - A function that generates content recommendations.
 * - RecommendedContentInput - The input type for the getRecommendedContent function.
 * - RecommendedContentOutput - The return type for the getRecommendedContent function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecommendedContentInputSchema = z.object({
  moodLogs: z.array(z.object({
    date: z.string(),
    mood: z.string(),
    activities: z.array(z.string()), // Keep as array of strings
    notes: z.string().optional(),
  })).min(1).describe('An array of at least one mood log.'),
  hormoneLevels: z.object({
    dopamine: z.number(),
    adrenaline: z.number(),
    cortisol: z.number(),
    serotonin: z.number(),
  }).describe('The user\'s current hormone levels.'),
  activities: z.array(z.string()).optional().describe('Optional list of recent activities performed by the user.'),
});

export type RecommendedContentInput = z.infer<typeof RecommendedContentInputSchema>;

const RecommendedContentOutputSchema = z.object({
  recommendations: z.array(z.string()).min(1).max(3).describe('An array of 1 to 3 recommended content titles. These titles must exactly match titles from the ContentService.'),
});

export type RecommendedContentOutput = z.infer<typeof RecommendedContentOutputSchema>;

// This is the actual flow, not exported directly
const recommendedContentFlowInternal = ai.defineFlow(
  {
    name: 'recommendedContentFlowInternal',
    inputSchema: RecommendedContentInputSchema,
    outputSchema: RecommendedContentOutputSchema,
  },
  async (input) => {
    const availableContentTitles = [
      "Understanding Dopamine: The Motivation Molecule",
      "10-Minute Guided Meditation for Stress Relief",
      "The Science of Energy & Focus with Dr. Andrew Huberman",
      "Serotonin: Functions, Normal Range, Side Effects, and More",
      "How to Manage Adrenaline for Better Performance"
    ];

    try {
      const { output, finishReason } = await ai.generate({
        prompt: `You are a wellness content curator for a GenZ app.
        Based on the user's recent mood logs, activities, and hormone levels, recommend 1 to 3 content titles.
        The recommendations MUST be chosen ONLY from the following list of available titles:
        ${availableContentTitles.map(title => `- "${title}"`).join('\n')}

        User Data:
        Mood Logs: ${JSON.stringify(input.moodLogs, null, 2)}
        Hormone Levels: ${JSON.stringify(input.hormoneLevels, null, 2)}
        Activities: ${input.activities ? JSON.stringify(input.activities, null, 2) : "None provided"}

        Respond with a JSON object containing a key "recommendations" which is an array of 1 to 3 chosen titles.
        Example: {"recommendations": ["Title A", "Title B"]}
        Ensure the titles in the "recommendations" array are exact matches from the provided list.
        If no specific recommendations fit, you can suggest general wellness content from the list like "10-Minute Guided Meditation for Stress Relief".
        `,
        model: 'googleai/gemini-2.0-flash',
        output: {
          schema: RecommendedContentOutputSchema,
        },
        config: {
          temperature: 0.5,
        }
      });

      if (finishReason !== 'stop' && finishReason !== 'length' && finishReason !== 'blocked') {
          console.warn(`Content recommendation generation finished due to ${finishReason}. Output may be incomplete.`);
      }
      
      if (!output || !output.recommendations || output.recommendations.length === 0) {
        console.error("AI failed to generate or parse recommendations. Raw output:", output);
        // Fallback to a default recommendation if AI fails
        return { recommendations: [availableContentTitles[1]] }; 
      }

      // Validate that AI recommended titles are from the available list
      const validRecommendations = output.recommendations.filter(rec => availableContentTitles.includes(rec));
      if (validRecommendations.length === 0) {
          console.warn("AI recommended titles not in the available list. Falling back. AI output:", output.recommendations);
          // Fallback if AI recommends invalid titles
          return { recommendations: [availableContentTitles[1]] }; 
      }

      return { recommendations: validRecommendations.slice(0,3) }; // Return up to 3 valid recommendations

    } catch (error: any) {
        console.error("Error during AI content recommendation generation:", error.message);
        // Fallback to a default recommendation on any exception
        return { recommendations: [availableContentTitles[1]] };
    }
  }
);

// Exported wrapper function
export async function getRecommendedContent(input: RecommendedContentInput): Promise<RecommendedContentOutput> {
  const parsedInput = RecommendedContentInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const errorMessage = parsedInput.error.issues.map(issue => issue.message).join('; ');
    console.error('Invalid input for content recommendation:', errorMessage, parsedInput.error.issues);
    // Fallback to a default recommendation if input validation fails
    return { recommendations: ["10-Minute Guided Meditation for Stress Relief"] };
  }
  return recommendedContentFlowInternal(parsedInput.data);
}

