'use server';
/**
 * @fileOverview Moderates community post content using an AI model.
 *
 * - moderateCommunityPost - A function that analyzes post content for appropriateness.
 * - ModerateCommunityPostInput - The input type for the moderation function.
 * - ModerateCommunityPostOutput - The return type for the moderation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateCommunityPostInputSchema = z.object({
  postContent: z.string().min(1).describe('The text content of the community post to be moderated.'),
});
export type ModerateCommunityPostInput = z.infer<typeof ModerateCommunityPostInputSchema>;

const ModerationFlagCategorySchema = z.enum([
    "HATE_SPEECH",
    "HARASSMENT",
    "SEXUALLY_EXPLICIT",
    "DANGEROUS_CONTENT",
    "SPAM",
    "OTHER"
]);

const ModerateCommunityPostOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the post content is considered appropriate for the community.'),
  reason: z.string().optional().describe('A brief reason if the post is deemed inappropriate. Keep it GenZ friendly but clear.'),
  flaggedCategories: z.array(ModerationFlagCategorySchema).optional().describe('Categories of inappropriate content detected.'),
});
export type ModerateCommunityPostOutput = z.infer<typeof ModerateCommunityPostOutputSchema>;

export async function moderateCommunityPost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
  return moderateCommunityPostFlow(input);
}

const moderateCommunityPostFlow = ai.defineFlow(
  {
    name: 'moderateCommunityPostFlow',
    inputSchema: ModerateCommunityPostInputSchema,
    outputSchema: ModerateCommunityPostOutputSchema,
  },
  async (input) => {
    const { output, finishReason } = await ai.generate({
      model: 'googleai/gemini-2.0-flash', // Or a model more specialized in moderation if available/configured
      prompt: `You are an AI content moderator for a GenZ wellness app's community forum. Your goal is to keep the vibes positive and safe.
      Analyze the following community post content. Determine if it's appropriate.
      If it's inappropriate, provide a brief, user-friendly (GenZ style) reason and identify the category of violation (e.g., HATE_SPEECH, HARASSMENT, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT, SPAM, OTHER).

      Post Content:
      "${input.postContent}"

      Consider the following guidelines for inappropriateness:
      - Hate speech (racism, sexism, homophobia, etc.)
      - Harassment or bullying
      - Sexually explicit content
      - Promotion of dangerous activities or self-harm
      - Spam or irrelevant advertising
      - Excessive negativity or personal attacks not constructive.

      If the content is appropriate, set isAppropriate to true.
      If it's inappropriate, set isAppropriate to false, provide a reason, and list flaggedCategories.

      Example of inappropriate:
      Post Content: "Everyone who likes pineapple on pizza is dumb lol, kys"
      Output: { "isAppropriate": false, "reason": "Woah there, bestie! Let's keep the chat respectful and avoid harmful jokes. #PositiveVibesOnly", "flaggedCategories": ["HARASSMENT", "DANGEROUS_CONTENT"] }
      
      Example of appropriate:
      Post Content: "Just crushed my workout! Feeling super energized today! What's everyone else up to?"
      Output: { "isAppropriate": true }

      Provide the output as a JSON object matching the defined schema.
      `,
      output: {
        schema: ModerateCommunityPostOutputSchema,
      },
      config: {
        temperature: 0.3, // Lower temperature for more deterministic moderation
        safetySettings: [ // Example: Stricter settings for sensitive categories
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ]
      },
    });

    if (finishReason === 'blocked') {
        return {
            isAppropriate: false,
            reason: "This post couldn't be processed due to safety filters. Keep it positive, fam!",
            flaggedCategories: ["OTHER"]
        };
    }
    
    if (!output) {
      console.error("AI moderation failed to produce an output for content:", input.postContent);
      // Fallback: assume inappropriate if AI fails to respond clearly, to err on the side of caution.
      // Or, could be less strict and allow it, depending on product decision.
      return {
        isAppropriate: false,
        reason: "AI moderator is taking a nap 😴. Please try rephrasing or post later.",
        flaggedCategories: ["OTHER"],
      };
    }

    // Ensure output adheres to schema, especially if 'reason' is missing for inappropriate posts
    if (!output.isAppropriate && !output.reason) {
        output.reason = "This post doesn't quite match our community vibes. Try to keep it positive and respectful!";
        if (!output.flaggedCategories || output.flaggedCategories.length === 0) {
            output.flaggedCategories = ["OTHER"];
        }
    }


    return output;
  }
);
