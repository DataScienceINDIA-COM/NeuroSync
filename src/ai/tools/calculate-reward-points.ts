'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CalculateRewardPointsInputSchema = z.object({
  taskDescription: z.string().describe('The description of the task.'),
  userMood: z.string().describe('The current mood of the user.'),
  hormoneLevels: z.object({
    dopamine: z.number(),
    adrenaline: z.number(),
    cortisol: z.number(),
    serotonin: z.number(),
  }).describe('The user\'s current hormone levels.'),
});

export type CalculateRewardPointsInput = z.infer<typeof CalculateRewardPointsInputSchema>;

const CalculateRewardPointsOutputSchema = z.number().min(10).max(30).describe('The calculated reward points for the task, between 10 and 30.');

export type CalculateRewardPointsOutput = z.infer<typeof CalculateRewardPointsOutputSchema>;

// Export a wrapper async function for easier invocation from server components/actions
export async function calculateRewardPoints(input: CalculateRewardPointsInput): Promise<CalculateRewardPointsOutput> {
  // Define the tool inside the async function
  const CalculateRewardPointsTool = ai.defineTool(
    {
      name: 'calculateRewardPointsInternal', // Changed name to avoid potential conflicts if registered globally elsewhere
      description: 'Calculates the appropriate reward points for a task based on its description, user mood, and hormone levels. Output should be a number between 10 and 30.',
      inputSchema: CalculateRewardPointsInputSchema,
      outputSchema: CalculateRewardPointsOutputSchema,
    },
    async (toolInput: CalculateRewardPointsInput): Promise<CalculateRewardPointsOutput> => {
      try {
        const { text, finishReason } = await ai.generate({
          prompt: `Given the following task details, user mood, and hormone levels, determine an appropriate reward point value between 10 and 30.
          Consider the task's perceived difficulty, effort, and potential impact on well-being.
          Task Description: "${toolInput.taskDescription}"
          User Mood: ${toolInput.userMood}
          Hormone Levels: Dopamine ${toolInput.hormoneLevels.dopamine}%, Adrenaline ${toolInput.hormoneLevels.adrenaline}%, Cortisol ${toolInput.hormoneLevels.cortisol}%, Serotonin ${toolInput.hormoneLevels.serotonin}%
          
          Respond with only a single number representing the reward points (e.g., 15, 25).`,
          model: 'googleai/gemini-2.0-flash',
          output: {
            format: 'text' 
          },
          config: {
            temperature: 0.5, // Slightly creative but still factual for point assignment
          }
        });

        if (finishReason !== 'stop' && finishReason !== 'length' && finishReason !== 'blocked') {
          console.warn(`Reward point generation finished due to ${finishReason}. Using default 20 points.`);
          return 20; // Default if generation didn't complete as expected
        }
        
        const points = parseInt(text || '20', 10);

        if (isNaN(points)) {
          console.warn(`Could not parse reward points from AI response: "${text}". Using default 20 points.`);
          return 20; // Default if parsing fails
        }
        
        // Clamp the value between 10 and 30
        return Math.min(30, Math.max(10, points));
      } catch (error: any) {
        console.error("Error during AI reward point calculation:", error.message, "Input:", toolInput);
        return 20; // Default to 20 points on any exception
      }
    }
  );
  
  // Call the locally defined tool
  return CalculateRewardPointsTool(input);
}
