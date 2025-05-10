
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
import { Message, MessageType, createMessage } from '@/tools/message';
import { Agent, getMemory, getLogger, getTriggers, runTerminalCommand, simulateUiApproval } from '@/tools/tools';
import { CommunityModeratorProfile } from '@/config/agentProfiles'; // Import agent profile

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
  reason: z.string().optional().describe('A brief reason if the post is deemed inappropriate. Keep it GenZ friendly but clear, consistent with GuardianAI Kai\'s persona.'),
  flaggedCategories: z.array(ModerationFlagCategorySchema).optional().describe('Categories of inappropriate content detected.')
});
export type ModerateCommunityPostOutput = z.infer<typeof ModerateCommunityPostOutputSchema>;


class CommunityModerator extends Agent {

    async moderateCommunityPost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
    return await this.moderatePost(input);
  }
    constructor() {
    super(CommunityModeratorProfile.name, getMemory(), getLogger() /* Removed getTriggers from constructor */);
    // If triggers are still needed, they should be added via this.add_trigger after super()
  }

  async moderatePost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
    // Simulate using runTerminalCommand and handling pending approval
    // In a real scenario, the agent would use a tool and wait for its response,
    // which might be 'pending_approval'.
    // This is a conceptual representation of entering a waiting state.

    const trigger = this.triggers.find(trigger => trigger.name === "NEW_POST");

    if(trigger && message){ // Assuming message is available in this context
      await trigger.action(message, this);
    }
    const moderationResult = await this.moderateCommunityPostFlow(input);

    // Conceptual handling of a tool requiring approval.
    // Simulate using runTerminalCommand and handling pending approval
    const commandToRun = 'echo "Moderation complete"';
    const commandResult = await runTerminalCommand(commandToRun, true); 

    if (commandResult.status === 'pending_approval') {
      console.log(`Command "${commandToRun}" pending user approval. Request ID: ${commandResult.requestId}`);
       if(commandResult.requestId) { 
        await simulateUiApproval(commandResult.requestId, true); 
       } else {
        console.error("Command did not return a request ID for approval simulation.");
       }
    }

    return moderationResult;
  }

  async sendMessage(message: Message): Promise<void> {
    this.logger.logMessage(message);
    console.log(`${this.name} sent a message:`, message);
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
        model: 'googleai/gemini-2.0-flash', 
        prompt: `${CommunityModeratorProfile.personaPrompt}
      Analyze the following community post content. Determine if it's appropriate.
      If it's inappropriate, provide a brief, user-friendly (GenZ style, consistent with your persona) reason and identify the category of violation (e.g., HATE_SPEECH, HARASSMENT, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT, SPAM, OTHER).
      
      Post Content:
      "${input.postContent}"

      Consider the following guidelines for inappropriateness:\n- Hate speech: Content promoting discrimination or hatred based on race, ethnicity, religion, gender, sexual orientation, disability, or other characteristics.\n- Harassment or bullying: Content intended to insult, intimidate, or harm another individual or group.\n- Sexually explicit content: Inappropriate sexual content, including descriptions or images.\n- Promotion of dangerous activities or self-harm: Content that encourages harm to oneself or others, or illegal activities.\n- Misinformation: False or misleading information that could harm the user, community or the general public.\n- Privacy violation: Sharing personal information about oneself or others without their explicit consent.\n- Spam or irrelevant advertising: Unwanted advertisements, repetitive content, or off-topic posts.\n- Excessive negativity or personal attacks not constructive.

      If the content is appropriate, set isAppropriate to true.
      If it's inappropriate, set isAppropriate to false, provide a reason, and list flaggedCategories.

      Example of inappropriate (adapt reason to your persona):
      Post Content: "Everyone who likes pineapple on pizza is dumb lol, kys! Btw, my social security number is 1234-5678-9."
      Output: { "isAppropriate": false, "reason": "Hey fam, let's keep it respectful and avoid sharing PII (like SSNs) for safety. Plus, no harmful suggestions, please! #KeepItSafe", "flaggedCategories": ["HARASSMENT", "DANGEROUS_CONTENT", "PRIVACY_VIOLATION"] }
      
      Example of appropriate:
      Post Content: "Just crushed my workout! Feeling super energized today! What's everyone else up to?"
      Output: { "isAppropriate": true }

      Example of inappropriate (adapt reason to your persona):
      Post Content: "Vaccines cause autism. I know because my uncle's friend's cousin said so."
      Output: { "isAppropriate": false, "reason": "Whoa there! Spreading info that isn't backed by science can be tricky. Let's make sure we're sharing reliable stuff to keep our community well-informed. #FactsOverFeels", "flaggedCategories": ["MISINFORMATION"] }\n\n

      Provide the output strictly as a JSON object matching the defined schema.
      `,
        output: {
          schema: ModerateCommunityPostOutputSchema,
        },
        config: {
          temperature: 0.3, 
          safetySettings: [ 
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
          reason: "Oops, this post got caught in our safety net! Let's keep the vibes positive and safe, bestie.",
          flaggedCategories: ["OTHER"],
        };
      }
  
      if (!output) {
        console.error("AI moderation failed to produce an output for content:", input.postContent);
        return {
          isAppropriate: false,
          reason: "Our AI moderator is taking a quick mental health break 😴. Please try rephrasing or post later!",
          flaggedCategories: ["OTHER"],
        };
      }
  
      if (!output.isAppropriate && !output.reason) {
        output.reason = "This post doesn't quite fit our community vibe. Let's keep it positive and respectful, fam!";
        if (!output.flaggedCategories || output.flaggedCategories.length === 0) {
          output.flaggedCategories = ["OTHER"];
        }
      }
  
      return output;
    }
  );
}

const communityModerator = new CommunityModerator();

export async function moderateCommunityPost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
  return communityModerator.moderateCommunityPost(input);
}

let message: Message | undefined = undefined;
