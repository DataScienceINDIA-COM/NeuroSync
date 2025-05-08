'use server';
/**
 * @fileOverview Generates a user avatar image based on a text description.
 *
 * - generateAvatar - A function that handles avatar image generation.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAvatarInputSchema = z.object({
  description: z
    .string()
    .min(10, { message: "Description needs to be a bit longer, fam! Minimum 10 characters." })
    .max(200, { message: "Keep it snappy, under 200 characters!"})
    .describe('A text description of the desired avatar image.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  imageUrl: z.string().describe("The generated avatar image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  // Validate input using Zod schema. Genkit flow will also do this, but early validation can be useful.
  const parsedInput = GenerateAvatarInputSchema.safeParse(input);
  if (!parsedInput.success) {
    // Construct a user-friendly error message from Zod issues
    const errorMessage = parsedInput.error.issues.map(issue => issue.message).join(' ');
    throw new Error(errorMessage || 'Invalid input for avatar generation.');
  }
  return generateAvatarFlow(parsedInput.data);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (input) => {
    const { media, text } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: `Generate a vibrant, cool, GenZ style avatar. The user wants: "${input.description}". Make it suitable as a profile picture. It should be fun and modern. Ensure the background is transparent or simple to blend well.`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // TEXT is required even if not primarily used.
        // Optional: Add safetySettings if needed, though default should be okay for avatars
        // safetySettings: [{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE'}]
      },
    });

    if (!media || !media.url) {
      // Log the text response from the model if image generation failed, for debugging.
      console.error('AI image generation failed. Text response from model:', text);
      throw new Error('AI failed to generate an image. Sadge. Maybe the prompt was too spicy or too vague?');
    }
    
    return { imageUrl: media.url };
  }
);

