import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the input schema for the personalized coaching flow
const PersonalizedCoachingInputSchema = z.object({
  userName: z.string().describe('The name of the user.'),
  moodLogs: z.array(z.object({
    date: z.string().describe('Date of the mood log (YYYY-MM-DD).'),
    mood: z.string().describe('The mood logged (e.g., Happy, Sad, Anxious).'),
    activities: z.array(z.string()).optional().describe('Optional list of activities.'),
    notes: z.string().optional().describe('Optional notes about the mood.'),
  })).describe('An array of recent mood logs.'),
  tasks: z.array(z.object({
    name: z.string().describe('The name of the task.'),
    isCompleted: z.boolean().describe('Whether the task is completed.'),
  })).describe('An array of user's tasks.'),
  streak: z.number().describe('The user\'s current streak in days.'),
  hormoneLevels: z.object({
    dopamine: z.number().describe('Dopamine level (0-100).'),
    adrenaline: z.number().describe('Adrenaline level (0-100).'),
    cortisol: z.number().describe('Cortisol level (0-100).'),
    serotonin: z.number().describe('Serotonin level (0-100).'),
  }).describe('The user's current hormone levels.'),
});

export type PersonalizedCoachingInput = z.infer<typeof PersonalizedCoachingInputSchema>;

// Define the output schema for the personalized coaching flow
const PersonalizedCoachingOutputSchema = z.object({
  coachingMessage: z.string().describe('A personalized, empathetic, and motivational coaching message in a GenZ-friendly tone.'),
  suggestedAction: z.string().optional().describe('An optional simple, actionable suggestion for the user.'),
});

export type PersonalizedCoachingOutput = z.infer<typeof PersonalizedCoachingOutputSchema>;

// Define the AI flow for personalized coaching
export const personalizedCoachingFlow = ai.defineFlow(
  {
    name: 'personalizedCoachingFlow',
    inputSchema: PersonalizedCoachingInputSchema,
    outputSchema: PersonalizedCoachingOutputSchema,
  },
  async (input) => {
    const { userName, moodLogs, tasks, streak, hormoneLevels } = input;

    // Create a prompt for the AI model
    const prompt = `You are VibeCoach, a personalized AI coaching assistant with a GenZ-friendly, empathetic, and motivational tone.
    Your goal is to provide concise and supportive messages based on the user's data.
    Keep your messages positive, encouraging, and relatable to a young audience. Use GenZ slang naturally but avoid being overly forced.
    Analyze the provided user data and offer a coaching message and optionally a simple, actionable suggestion.

    User Data:
    - Name: ${userName}
    - Streak: ${streak} days
    - Hormone Levels (0-100%): Dopamine: ${hormoneLevels.dopamine}%, Adrenaline: ${hormoneLevels.adrenaline}%, Cortisol: ${hormoneLevels.cortisol}%, Serotonin: ${hormoneLevels.serotonin}%
    - Recent Mood Logs:
    ${moodLogs.length > 0 ? moodLogs.map(log => `- Date: ${log.date}, Mood: ${log.mood}, Activities: ${log.activities?.join(', ') || 'None'}, Notes: ${log.notes || 'None'}`).join('
') : 'No recent mood logs.'}
    - Tasks:
    ${tasks.length > 0 ? tasks.map(task => `- ${task.name} (Completed: ${task.isCompleted})`).join('
') : 'No tasks listed.'}

    Generate a personalized coaching message and an optional suggested action based on this data.
    Format the output strictly as a JSON object matching the defined schema (coachingMessage: string, suggestedAction: string | undefined).
    `;

    try {
      const { output, finishReason } = await ai.generate({
        model: 'googleai/gemini-2.0-flash', // Using a suitable Genkit model
        prompt: prompt,
        output: {
          schema: PersonalizedCoachingOutputSchema,
        },
        config: {
          temperature: 0.8, // Higher temperature for more creative responses
        },
      });

      if (finishReason === 'blocked') {
        return {
          coachingMessage: `Hey ${userName}! VibeCoach is here! Keep shining, fam! ✨ Sometimes words get blocked, but your energy is still 💯.`,
        };
      }

      if (!output) {
        console.error("AI coaching failed to produce an output.");
        // Fallback message
        return {
          coachingMessage: `Yo ${userName}! VibeCoach checking in! Keep doing you, bestie! 🌱`,
          suggestedAction: 'Take a deep breath.',
        };
      }

      return output;

    } catch (error: any) {
      console.error("Error generating personalized coaching message:", error);
      // Fallback message on error
      return {
        coachingMessage: `Oof, VibeCoach had a moment! 😅 Keep your head up, ${userName}!`,n        suggestedAction: 'Maybe stretch it out?',
      };
    }
  }
);
