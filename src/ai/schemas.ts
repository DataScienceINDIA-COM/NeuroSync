import { z } from 'genkit';

// Schemas for generate-avatar-flow.ts
export const GenerateAvatarInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting the avatar.'),
  description: z.string().min(10).max(200).describe('A detailed description of the avatar to be generated. Min 10, Max 200 characters.'),
  previousAvatarPath: z.string().optional().describe('The Firebase Storage path of the previous avatar, if any, to be deleted.')
});

export const GenerateAvatarOutputSchema = z.object({
  imageUrl: z.string().describe("The URL of the generated avatar image hosted on Firebase Storage."),
  imagePath: z.string().describe("The Firebase Storage path for the generated avatar image."),
  feedback: z.string().optional().describe("Feedback on the avatar description if it was modified or suggestions for improvement.")
});

// Schemas for moderate-community-post-flow.ts
export const ModerateCommunityPostInputSchema = z.object({
  postContent: z.string().min(1).max(5000).describe('The content of the community post to be moderated.'),
});

export const ModerateCommunityPostOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the post content is deemed appropriate.'),
  reason: z.string().optional().describe('The reason for moderation if the content is inappropriate.'),
  categories: z.array(z.string()).optional().describe('Categories of inappropriateness (e.g., hate_speech, spam).'),
});

// Schemas for task-suggestions.ts
export const TaskSuggestionsInputSchema = z.object({
  moodLogs: z.array(z.object({
    date: z.string().describe("Date of the mood log (e.g., YYYY-MM-DD)"),
    mood: z.string().describe("The mood logged (e.g., Happy, Stressed)"),
    activities: z.array(z.string()).describe("List of activities for that day"),
    notes: z.string().optional().describe("Optional notes for the day"),
  })).min(1).describe('An array of mood logs, requiring at least one entry.'),
  hormoneLevels: z.object({
    dopamine: z.number(),
    adrenaline: z.number(),
    cortisol: z.number(),
    serotonin: z.number(),
  }).describe('The user\'s current estimated hormone levels.'),
  completedTasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    rewardPoints: z.number(),
    isCompleted: z.boolean(),
    hasNeuroBoost: z.boolean(),
  })).optional().describe('The user\'s recently completed tasks (optional).'),
});

export const SuggestedTaskDetailSchema = z.object({
  name: z.string().describe("The name of the suggested task."),
  description: z.string().describe("A brief description of the task. Keep it GenZ-friendly and encouraging!"),
  hasNeuroBoost: z.boolean().describe("Whether the task is likely to provide a significant mental/emotional boost (e.g., for VibePoints multiplier)."),
});

export const TaskSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedTaskDetailSchema).describe('An array of 2-3 suggested task details (name, description, hasNeuroBoost).'),
});
