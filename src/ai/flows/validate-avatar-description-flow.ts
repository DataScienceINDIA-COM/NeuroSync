
'use server';
/**
 * @fileOverview Validates avatar descriptions using AI.
 * - validateAvatarDescription - Validates an avatar description.
 * - ValidateAvatarDescriptionInput - Input type for validation.
 * - ValidateAvatarDescriptionOutput - Output type for validation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ValidateAvatarDescriptionInputSchema = z.object({
  description: z.string().min(1).max(500).describe('The avatar description to validate.'),
});
export type ValidateAvatarDescriptionInput = z.infer<typeof ValidateAvatarDescriptionInputSchema>;

const ValidateAvatarDescriptionOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the description is valid and appropriate.'),
  feedback: z.string().optional().describe('Feedback if the description is invalid or could be improved.'),
  revisedDescription: z.string().optional().describe('A revised description if minor improvements were made by the AI.'),
});
export type ValidateAvatarDescriptionOutput = z.infer<typeof ValidateAvatarDescriptionOutputSchema>;

export async function validateAvatarDescription(input: ValidateAvatarDescriptionInput): Promise<ValidateAvatarDescriptionOutput> {
  return validateAvatarDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateAvatarDescriptionPrompt',
  input: { schema: ValidateAvatarDescriptionInputSchema },
  output: { schema: ValidateAvatarDescriptionOutputSchema },
  prompt: `You are an AI assistant responsible for validating avatar descriptions for a family-friendly wellness app.
The description will be used to generate an avatar image.

Please evaluate the following avatar description:
Description: "{{description}}"

Your task is to:
1. Determine if the description is appropriate (not offensive, not harmful, not sexually explicit, not promoting violence, etc.).
2. Determine if the description is clear enough to generate a distinct avatar (not too vague, not contradictory).
3. If the description is valid but could be slightly improved for clarity or to be more evocative, you can provide a 'revisedDescription'. Do not make major changes.
4. If the description is invalid, set 'isValid' to false and provide 'feedback' explaining why.
5. If the description is valid, set 'isValid' to true. 'feedback' can be used for minor suggestions if no 'revisedDescription' is provided.

Examples of invalid descriptions and feedback:
- "A bloody knife" -> isValid: false, feedback: "The description contains violent imagery which is not allowed."
- "Something cool" -> isValid: false, feedback: "The description is too vague. Please provide more details about the avatar you envision."
- "A character doing illegal things" -> isValid: false, feedback: "Descriptions depicting illegal activities are not permitted."

Examples of valid descriptions:
- "A happy blue cat wearing a small red hat." -> isValid: true
- "A majestic phoenix with fiery wings, soaring through a starry sky." -> isValid: true
- "A friendly robot made of gears and copper, holding a flower." -> isValid: true, revisedDescription: "A friendly, curious robot constructed from interlocking gears and polished copper, gently holding a single, vibrant flower." (Optional revision)

Respond with a JSON object matching the output schema.
`,
});

const validateAvatarDescriptionFlow = ai.defineFlow(
  {
    name: 'validateAvatarDescriptionFlow',
    inputSchema: ValidateAvatarDescriptionInputSchema,
    outputSchema: ValidateAvatarDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        // Fallback if AI fails to generate or returns empty
        console.error("AI failed to provide a validation response for avatar description.");
        return {
            isValid: false, // Default to invalid if AI fails
            feedback: "Could not validate the description at this time. Please try a different description or try again later."
        };
    }
    return output;
  }
);

