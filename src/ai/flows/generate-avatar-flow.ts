
'use server';
/**
 * @fileOverview Generates an avatar image using AI.
 * - generateAvatar - Generates an avatar.
 * - GenerateAvatarInput - Input type for avatar generation.
 * - GenerateAvatarOutput - Output type for avatar generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { uploadAvatarToStorage } from '@/lib/firebase-storage';
import { validateAvatarDescription } from './validate-avatar-description-flow'; 
// It's good practice to check adminInitError if firebase-storage operations were to use Admin SDK
// For now, firebase-storage.ts uses client SDK, which is problematic for server flows.
// This flow should ideally use Admin SDK for storage operations if they happen server-side.
// import { adminInitError } from '@/lib/firebase-admin';


export const GenerateAvatarInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting the avatar.'),
  description: z.string().min(10).max(200).describe('A detailed description of the avatar to be generated. Min 10, Max 200 characters.'),
  previousAvatarPath: z.string().optional().describe('The Firebase Storage path of the previous avatar, if any, to be deleted.')
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  imageUrl: z.string().describe("The URL of the generated avatar image hosted on Firebase Storage."),
  imagePath: z.string().describe("The Firebase Storage path for the generated avatar image."),
  feedback: z.string().optional().describe("Feedback on the avatar description if it was modified or suggestions for improvement.")
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;


export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  // Example of checking admin error if operations were to use Admin SDK
  // if (adminInitError) {
  //   console.error("Firebase Admin SDK not initialized. Cannot generate avatar related to storage ops.", adminInitError.message);
  //   throw new Error("Avatar generation service unavailable due to server configuration error.");
  // }

  // Validate the description
  const validationResult = await validateAvatarDescription({ description: input.description });
  if (!validationResult.isValid) {
    throw new Error(`Avatar description invalid: ${validationResult.feedback}`);
  }
  const descriptionToUse = validationResult.revisedDescription || input.description;

  // Generate the image using AI (e.g., Gemini 2.0 Flash with image generation)
  const { media, text: generationText } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp', // Ensure this model supports image generation
    prompt: `Generate an avatar based on this description: ${descriptionToUse}. The style should be vibrant, modern, and suitable for a wellness app avatar.`,
    config: {
      responseModalities: ['IMAGE', 'TEXT'], // Request both image and text
    },
  });

  if (!media || !media.url) {
    console.error("AI image generation failed or did not return an image URL. Generation text:", generationText);
    throw new Error('AI image generation failed. Please try a different description or try again later.');
  }

  // The media.url will be a data URI (e.g., "data:image/png;base64,...")
  const imageDataURI = media.url;

  // Upload the image data URI to Firebase Storage
  try {
    const { downloadURL, imagePath } = await uploadAvatarToStorage(input.userId, imageDataURI, input.previousAvatarPath);
    return { 
      imageUrl: downloadURL, 
      imagePath: imagePath,
      feedback: validationResult.feedback // Pass along any feedback from description validation
    };
  } catch (error) {
    console.error('Failed to upload avatar to Firebase Storage:', error);
    // It might be useful to delete the generated AI image if storage upload fails,
    // but data URIs are transient unless stored.
    throw new Error('Failed to store the generated avatar. Please try again.');
  }
}

// This defines the flow for Genkit, but the actual logic is in the generateAvatar async function above.
// For direct calls from server components/actions, calling generateAvatar directly is fine.
// Defining it as a flow makes it discoverable by Genkit tools and potentially deployable.
const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  generateAvatar // Use the async function directly
);

// Export the main function to be called by server actions/components
// The flow definition itself doesn't need to be exported if it's only called internally or via Genkit tools.
// However, exporting the wrapper 'generateAvatar' is good practice.
// export { generateAvatar }; // This is implicitly exported by being a top-level function.
