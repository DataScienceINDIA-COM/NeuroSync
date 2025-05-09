'use server';
/**
 * @fileOverview Moderates community post content using an AI model.
 *
 * - moderateCommunityPost - A function that analyzes post content for appropriateness.
 * - ModerateCommunityPostInput - The input type for the moderation function.
 * - ModerateCommunityPostOutput - The return type for the moderation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message, MessageType } from '@/tools/message';
import { Agent, getMemory, getLogger, getTriggers } from '@/tools/tools';

const ModerateCommunityPostInputSchema = z.object({
  postContent: z.string().min(1).describe('The text content of the community post to be moderated.'),
});
export type ModerateCommunityPostInput = z.infer<typeof ModerateCommunityPostInputSchema>;

const ModerationFlagCategorySchema = z.enum([
    "HATE_SPEECH", // Content promoting discrimination or hatred
    "HARASSMENT", // Bullying or intimidation
    "SEXUALLY_EXPLICIT", // Inappropriate sexual content
    "DANGEROUS_CONTENT", // Content promoting self-harm or illegal activities
    "SPAM", // Unwanted advertisements or repetitive content
    "MISINFORMATION", // False or misleading information
    "PRIVACY_VIOLATION", // Sharing personal information without consent
    "OTHER"
]);

const ModerateCommunityPostOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the post content is considered appropriate for the community.'),
  reason: z.string().optional().describe('A brief reason if the post is deemed inappropriate. Keep it GenZ friendly but clear.'),
  flaggedCategories: z.array(ModerationFlagCategorySchema).optional().describe('Categories of inappropriate content detected.')
});
export type ModerateCommunityPostOutput = z.infer<typeof ModerateCommunityPostOutputSchema>;


class CommunityModerator extends Agent {

    async moderateCommunityPost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
    return await this.moderatePost(input);
  }
    constructor() {
    super('CommunityModerator', getMemory(), getLogger(), getTriggers());
  }

  async moderatePost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
    const trigger = this.triggers.find(trigger => trigger.name === "NEW_POST");
    if(trigger){
      await trigger.execute({"postContent": input.postContent});
    }
    return this.moderateCommunityPostFlow(input);
  }

  async receiveMessage(message: Message): Promise<void> {
    this.logger.logMessage(message);
    if (message.type === MessageType.REQUEST_INFORMATION) {
      // Process information requests, could be to moderate a post
      if (message.content.action === 'moderatePost') {
        const postContent = message.content.postContent;
        if (postContent) {
          const moderationResult = await this.generateModerationOutput({ postContent });
          const responseMessage = new Message(
            this.name,
            message.sender,
            MessageType.OBSERVATION,
            { action: 'moderationResult', result: moderationResult },
          );
          this.sendMessage(responseMessage);
        } else {
          console.error('postContent is missing in the message content');
        }
      }

    }
     else {
        console.log("Community Moderator received a message:", message);
      }
  }

  async sendMessage(message: Message): Promise<void> {
    this.logger.logMessage(message);
    // In this basic example, we're just logging the message.
    // In a real application, you'd send the message to other agents or the user.
    console.log('Community Moderator sent a message:', message);
  }

  async useLlm(prompt: string): Promise<any> {
    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: prompt,
    });
    return result.output;
  }

  private moderateCommunityPostFlow = ai.defineFlow(
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

      Consider the following guidelines for inappropriateness:\n- Hate speech: Content promoting discrimination or hatred based on race, ethnicity, religion, gender, sexual orientation, disability, or other characteristics.\n- Harassment or bullying: Content intended to insult, intimidate, or harm another individual or group.\n- Sexually explicit content: Inappropriate sexual content, including descriptions or images.\n- Promotion of dangerous activities or self-harm: Content that encourages harm to oneself or others, or illegal activities.\n- Misinformation: False or misleading information that could harm the user, community or the general public.\n- Privacy violation: Sharing personal information about oneself or others without their explicit consent.\n- Spam or irrelevant advertising: Unwanted advertisements, repetitive content, or off-topic posts.\n- Spam or irrelevant advertising\n- Excessive negativity or personal attacks not constructive.

      If the content is appropriate, set isAppropriate to true.
      If it's inappropriate, set isAppropriate to false, provide a reason, and list flaggedCategories.

      Example of inappropriate:
      Post Content: "Everyone who likes pineapple on pizza is dumb lol, kys! Btw, my social security number is 1234-5678-9."
      Output: { "isAppropriate": false, "reason": "Hey! Let's chill with the insults and keep personal info safe. Plus, no promoting harm here! #RespectfulCommunity", "flaggedCategories": ["HARASSMENT", "DANGEROUS_CONTENT", "PRIVACY_VIOLATION"] }
      
      Example of appropriate:
      Post Content: "Just crushed my workout! Feeling super energized today! What's everyone else up to?"
      Output: { "isAppropriate": true }

      Example of inappropriate:
      Post Content: "Vaccines cause autism. I know because my uncle's friend's cousin said so."
      Output: { "isAppropriate": false, "reason": "Whoa, we need to keep info accurate and reliable. Let's avoid spreading claims without evidence. #FactCheck", "flaggedCategories": ["MISINFORMATION"] }\n\n

      Provide the output strictly as a JSON object matching the defined schema.
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
          ],
        },
      });
  
      if (finishReason === 'blocked') {
        return {
          isAppropriate: false,
          reason: "Oops, this post got caught in our safety net! Let's keep the vibes positive and safe.",
          flaggedCategories: ["OTHER"],
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
        output.reason = "This post doesn't quite fit our community vibe. Let's keep it positive and respectful!";
        if (!output.flaggedCategories || output.flaggedCategories.length === 0) {
          output.flaggedCategories = ["OTHER"];
        }
      }
  
  
      return output;
    }
  );
  private async generateModerationOutput(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
    const result = await this.moderateCommunityPostFlow(input);
    if(result) return result;
    else return {
        isAppropriate: false,
        reason: "AI moderator is taking a nap 😴. Please try rephrasing or post later.",
        flaggedCategories: ["OTHER"],
      };
    }
}

const communityModerator = new CommunityModerator();

export async function moderateCommunityPost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
  return communityModerator.moderateCommunityPost(input);
}
