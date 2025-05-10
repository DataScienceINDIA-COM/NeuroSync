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

export const ModerateCommunityPostInputSchema = z.object({
  postContent: z.string().min(1).max(5000).describe('The content of the community post to be moderated.'),
  // Optional: Add userId or other context if needed by the moderator
  // userId: z.string().optional().describe('The ID of the user who created the post.'),
});
export type ModerateCommunityPostInput = z.infer<typeof ModerateCommunityPostInputSchema>;

export const ModerateCommunityPostOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the post content is deemed appropriate.'),
  reason: z.string().optional().describe('The reason for moderation if the content is inappropriate.'),
  categories: z.array(z.string()).optional().describe('Categories of inappropriateness (e.g., hate_speech, spam).'),
});
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
