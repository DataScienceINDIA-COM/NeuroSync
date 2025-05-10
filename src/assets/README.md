// src/ai/flows/community-challenges-flow.ts
import { generateText, streamText, tool } from 'genkit';
import { z } from 'zod';
import { calculateRewardPoints } from '../tools/calculate-reward-points';

export const communityChallengesFlow = streamText({
  name: 'communityChallengesFlow',
  input: z.string().describe('User input describing community or challenge ideas.'),
  tools: [calculateRewardPoints],
  output: z.string().describe('Suggested community challenge ideas and potential rewards.'),
}, async (input, streamingHandle) => {
  const prompt = `Analyze the user's input and suggest creative and engaging community challenge ideas. For each idea, propose a potential reward and use the calculateRewardPoints tool to determine a suitable point value. Ensure the suggestions are relevant to the user's description of community or challenge ideas.

User Input: ${input}`;

  const llmResponse = await generateText({
    model: 'gemini-1.5-flash',
    prompt: prompt,
    tools: [calculateRewardPoints],
  });

  await streamingHandle.streamToken(llmResponse.text());
});