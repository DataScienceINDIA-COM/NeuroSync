
'use server';
/**
 * @fileOverview Moderates community post content using an AI agent.
 *
 * - moderateCommunityPost - A function that handles the community post moderation process.
 * - ModerateCommunityPostInput - The input type for the moderateCommunityPost function.
 * - ModerateCommunityPostOutput - The return type for the moderateCommunityPost function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CommunityModeratorProfile } from '@/config/agentProfiles';
import { ModerateCommunityPostInputSchema, ModerateCommunityPostOutputSchema } from '@/ai/schemas';

export type ModerateCommunityPostInput = z.infer<typeof ModerateCommunityPostInputSchema>;
export type ModerateCommunityPostOutput = z.infer<typeof ModerateCommunityPostOutputSchema>;

// This is the function that will be imported and used.
export async function moderateCommunityPost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
  return moderateCommunityPostFlow(input);
}

const moderationPrompt = ai.definePrompt({
  name: 'moderateCommunityPostPrompt',
  input: { schema: ModerateCommunityPostInputSchema },
  output: { schema: ModerateCommunityPostOutputSchema },
  system: `You are ${CommunityModeratorProfile.name}, ${CommunityModeratorProfile.description}. Your persona is: "${CommunityModeratorProfile.personaPrompt}".
You are moderating content for a GenZ wellness app.
Evaluate the following post content for appropriateness according to standard community guidelines (no hate speech, harassment, spam, explicit content, violence, self-harm promotion, misinformation).
Post Content: "{{postContent}}"

Respond with a JSON object indicating if the content is_appropriate.
If not appropriate, provide a brief 'reason' (GenZ friendly but clear) and 'categories' of violation.
If appropriate, the 'reason' and 'categories' can be omitted or empty.
`,
});

const moderateCommunityPostFlow = ai.defineFlow(
  {
    name: 'moderateCommunityPostFlow',
    inputSchema: ModerateCommunityPostInputSchema,
    outputSchema: ModerateCommunityPostOutputSchema,
  },
  async (input) => {
    const { output } = await moderationPrompt(input);
    if (!output) {
      // Fallback if AI fails
      console.error("AI moderation failed to provide an output for content:", input.postContent);
      // Default to appropriate with a warning if AI fails, or false if stricter.
      // For safety, let's default to inappropriate if the moderator fails to respond.
      return {
        isAppropriate: false, 
        reason: "AI moderator review inconclusive. Content blocked as a precaution.",
        categories: ["moderator_error"],
      };
    }
    return output;
  }
);
