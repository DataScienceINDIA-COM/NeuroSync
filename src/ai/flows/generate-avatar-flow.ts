
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
import { GenerateAvatarInputSchema, GenerateAvatarOutputSchema } from '@/ai/schemas';

export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;


export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
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
  generateAvatar 
);
