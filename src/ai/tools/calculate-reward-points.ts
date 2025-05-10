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

const CalculateRewardPointsOutputSchema = z.number().min(10).max(30).describe('The calculated reward points for the task. Should be an integer between 10 and 30.');
export type CalculateRewardPointsOutput = z.infer<typeof CalculateRewardPointsOutputSchema>;

async function calculatePointsLogic(input: CalculateRewardPointsInput): Promise<CalculateRewardPointsOutput> {
  const { text } = await ai.generate({
    prompt: `Based on the task description ("${input.taskDescription}"), user's mood ("${input.userMood}"), and hormone levels (${JSON.stringify(input.hormoneLevels)}), determine the appropriate reward points.
    The reward points should be an integer between 10 and 30.
    Consider the task's difficulty (e.g., physical tasks, mentally challenging tasks, simple tasks) and the user's current state.
    Respond with only the numerical value for the reward points. For example: 15 or 25.`,
    model: 'googleai/gemini-pro', 
  });

  try {
    const rewardPoints = parseInt(text || '15');
    if (isNaN(rewardPoints)) {
        console.warn("AI response for reward points was not a number, got:", text, "Defaulting to 15.");
        return 15;
    }
    return Math.min(30, Math.max(10, rewardPoints));
  } catch (error) {
    console.error("Failed to parse AI response for reward points:", text, error);
    return 15; 
  }
}

// Define the tool but do not export it directly if this file is 'use server'
const CalculateRewardPointsTool = ai.defineTool(
  {
    name: 'calculateRewardPointsTool', 
    description: 'Calculates the appropriate reward points for a task based on its description and the user\'s state.',
    inputSchema: CalculateRewardPointsInputSchema,
    outputSchema: CalculateRewardPointsOutputSchema,
  },
  calculatePointsLogic
);

// Export the async wrapper function
export async function calculateRewardPoints(input: CalculateRewardPointsInput): Promise<CalculateRewardPointsOutput> {
  return calculatePointsLogic(input);
}
