
'use server';
/**
 * @fileOverview Generates a user avatar image based on a text description and uploads it to Firebase Storage.
 * Includes AI-powered validation of the description.
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
    .describe('A text description of the desired avatar image. This will be validated by an AI.'),
  previousAvatarPath: z.string().optional().describe('The Firebase Storage path of the previous avatar, if one exists, to be deleted.')
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  imageUrl: z.string().url().describe("The Firebase Storage download URL of the generated avatar image."),
  imagePath: z.string().describe("The Firebase Storage path of the generated avatar image."),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

// Schema for AI validation of the avatar description
const AvatarDescriptionValidationOutputSchema = z.object({
  isValid: z.boolean().describe("Whether the description is appropriate and clear enough for avatar generation."),
  feedback: z.string().optional().describe("Feedback if the description is not valid (e.g., too vague, inappropriate content). Keep it GenZ friendly!"),
});
type AvatarDescriptionValidationOutput = z.infer<typeof AvatarDescriptionValidationOutputSchema>;


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

// AI Prompt for validating the avatar description
const validateAvatarDescriptionPrompt = ai.definePrompt({
  name: 'validateAvatarDescriptionPrompt',
  input: { schema: z.object({ description: GenerateAvatarInputSchema.shape.description }) },
  output: { schema: AvatarDescriptionValidationOutputSchema },
  prompt: `You are an AI assistant that validates avatar descriptions for a GenZ wellness app.
The description will be used to generate an image.
Your task is to check if the description is:
1.  Appropriate: Not offensive, hateful, sexually explicit, or promoting harm.
2.  Clear: Understandable and specific enough to guide image generation. Avoid overly vague or abstract terms unless they are common artistic styles (e.g., "surreal", "pixel art").
3.  Concise: While the user has length limits, ensure it's not gibberish.

User's Avatar Description: "{{description}}"

Respond with whether it's valid and provide brief, GenZ-style feedback if it's not.
For example:
- If description is "a happy cat", respond: { "isValid": true }
- If description is "bad words and stuff", respond: { "isValid": false, "feedback": "Whoa there, let's keep it PG, fam! Try a different vibe." }
- If description is "something cool", respond: { "isValid": false, "feedback": "That's a bit too vague, bestie! Give me some more deets so I can work my magic. ✨" }
- If description is "a really happy awesome cool fun amazing detailed character that is super great and also nice", respond: { "isValid": true } (length is handled by schema, focus on content)

Provide your response as a JSON object matching the defined output schema.
  `,
});


const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (input) => {
    // Step 1: Validate the description using AI
    const validationResponse = await validateAvatarDescriptionPrompt({ description: input.description });
    
    if (!validationResponse.output?.isValid) {
      const feedback = validationResponse.output?.feedback || "That avatar description isn't quite working. Try something else!";
      console.warn(`Avatar description validation failed for user ${input.userId}: ${feedback}. Description: "${input.description}"`);
      throw new Error(feedback);
    }
    
    // Step 2: Generate the image if validation passed
    const { media, text } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: `Generate a vibrant, cool, GenZ style avatar. The user wants: "${input.description}". Make it suitable as a profile picture. It should be fun and modern. Ensure the background is transparent or simple to blend well.`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // TEXT is required even if not primarily used.
        safetySettings: [ // Stricter safety for image generation
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ]
      },
    });

    if (!media || !media.url) {
      console.error('AI image generation failed. Text response from model:', text);
      throw new Error('AI failed to generate an image. Sadge. Maybe the prompt was too spicy or too vague?');
    }
    
    // Step 3: Upload to Firebase Storage
    try {
      const downloadURL = await uploadAvatarToStorage(input.userId, media.url, input.previousAvatarPath);
      
      const urlParts = new URL(downloadURL);
      const pathName = urlParts.pathname; 
      const objectPathEncoded = pathName.substring(pathName.indexOf('/o/') + 3); 
      const imagePath = decodeURIComponent(objectPathEncoded); 

      return { imageUrl: downloadURL, imagePath: imagePath };
    } catch (uploadError) {
      console.error('Failed to upload avatar to Firebase Storage:', uploadError);
      throw new Error('Failed to save your new avatar. Please try again.');
    }
  }
);

