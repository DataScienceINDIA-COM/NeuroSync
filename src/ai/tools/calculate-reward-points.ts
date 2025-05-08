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

// This is the tool definition, not exported directly from the 'use server' file.
const CalculateRewardPointsTool = ai.defineTool(
  {
    name: 'calculateRewardPoints',
    description: 'Calculates the appropriate reward points for a task based on its description, user mood, and hormone levels. Output should be a number between 10 and 30.',
    inputSchema: CalculateRewardPointsInputSchema,
    outputSchema: CalculateRewardPointsOutputSchema,
  },
  async (input: CalculateRewardPointsInput): Promise<CalculateRewardPointsOutput> => {
    const { text, finishReason } = await ai.generate({
      prompt: `Given the following task details, user mood, and hormone levels, determine an appropriate reward point value between 10 and 30.
      Consider the task's perceived difficulty, effort, and potential impact on well-being.
      Task Description: "${input.taskDescription}"
      User Mood: ${input.userMood}
      Hormone Levels: Dopamine ${input.hormoneLevels.dopamine}%, Adrenaline ${input.hormoneLevels.adrenaline}%, Cortisol ${input.hormoneLevels.cortisol}%, Serotonin ${input.hormoneLevels.serotonin}%
      
      Respond with only a single number representing the reward points (e.g., 15, 25).`,
      model: 'googleai/gemini-2.0-flash',
      output: {
        format: 'text' 
      },
      config: {
        temperature: 0.5, // Slightly creative but still factual for point assignment
      }
    });

    if (finishReason !== 'stop' && finishReason !== 'length') {
      console.warn(`Reward point generation finished due to ${finishReason}. Using default.`);
      return 20; // Default if generation didn't complete as expected
    }
    
    const points = parseInt(text || '20', 10);

    if (isNaN(points)) {
      console.warn(`Could not parse reward points from AI response: "${text}". Using default.`);
      return 20; // Default if parsing fails
    }
    
    // Clamp the value between 10 and 30
    return Math.min(30, Math.max(10, points));
  }
);

// Export a wrapper async function for easier invocation from server components/actions
export async function calculateRewardPoints(input: CalculateRewardPointsInput): Promise<CalculateRewardPointsOutput> {
  // Internally, this function can call the tool if needed, or directly implement logic.
  // For this structure, it directly invokes the tool's logic.
  return CalculateRewardPointsTool(input);
}
