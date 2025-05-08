
'use server';
/**
 * @fileOverview Generates a user avatar image based on a text description and uploads it to Firebase Storage.
 *
 * - generateAvatar - A function that handles avatar image generation and storage.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function (contains Firebase Storage URL).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { uploadAvatarToStorage } from '@/lib/firebase-storage'; // Import the storage helper

const GenerateAvatarInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the avatar is being generated. Used for storage path.'),
  description: z
    .string()
    .min(10, { message: "Description needs to be a bit longer, fam! Minimum 10 characters." })
    .max(200, { message: "Keep it snappy, under 200 characters!"})
    .describe('A text description of the desired avatar image.'),
  previousAvatarPath: z.string().optional().describe('The Firebase Storage path of the previous avatar, if one exists, to be deleted.')
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  imageUrl: z.string().url().describe("The Firebase Storage download URL of the generated avatar image."),
  imagePath: z.string().describe("The Firebase Storage path of the generated avatar image."),
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
      },
    });

    if (!media || !media.url) {
      console.error('AI image generation failed. Text response from model:', text);
      throw new Error('AI failed to generate an image. Sadge. Maybe the prompt was too spicy or too vague?');
    }
    
    // media.url is a data URI like "data:image/png;base64,..."
    // Upload to Firebase Storage
    try {
      const downloadURL = await uploadAvatarToStorage(input.userId, media.url, input.previousAvatarPath);
      
      // Extract path from downloadURL (this is a bit of a workaround, ideally storage helper might return path too)
      // URL is like: https://firebasestorage.googleapis.com/v0/b/your-project-id.appspot.com/o/avatars%2FuserId%2Ffilename.png?alt=media&token=...
      // We need the "avatars/userId/filename.png" part (URL encoded)
      const urlParts = new URL(downloadURL);
      const pathName = urlParts.pathname; // /v0/b/your-project-id.appspot.com/o/avatars%2FuserId%2Ffilename.png
      const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3); // avatars%2FuserId%2Ffilename.png
      const imagePath = decodeURIComponent(objectPathEncoded); // avatars/userId/filename.png

      return { imageUrl: downloadURL, imagePath: imagePath };
    } catch (uploadError) {
      console.error('Failed to upload avatar to Firebase Storage:', uploadError);
      throw new Error('Failed to save your new avatar. Please try again.');
    }
  }
);

