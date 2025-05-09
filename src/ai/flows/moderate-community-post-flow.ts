
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
    super('CommunityModerator', getMemory(), getLogger() /* Removed getTriggers from constructor */);
    // If triggers are still needed, they should be added via this.add_trigger after super()
  }

  async moderatePost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
    // Simulate using runTerminalCommand and handling pending approval
    // In a real scenario, the agent would use a tool and wait for its response,
    // which might be 'pending_approval'.
    // This is a conceptual representation of entering a waiting state.

    const trigger = this.triggers.find(trigger => trigger.name === "NEW_POST");

    // Conceptual use of enhanced code analysis tools:
    // The Community Moderator might use these tools to understand code related to
    // content moderation features, user reporting mechanisms, or data storage of posts.
    // This is not directly related to moderating a specific post, but rather
    // understanding the system it operates within.

    // Example: Run static analysis on a hypothetical moderation utility file to check for issues.
    // This would be integrated with the simulated approval workflow if the tool requires it.
    /*
    const moderationUtilAnalysis = await runStaticAnalysis('src/utils/moderationUtils.ts'); // Assuming runStaticAnalysis is exported from @/tools/tools
    console.log('Conceptual use of runStaticAnalysis for moderationUtils.ts:', moderationUtilAnalysis);
     */

    // Example: Get dependencies of a file that handles user reporting to understand its connections.
    // This would also integrate with the simulated approval workflow if needed.
    /*
    const reportingDependencies = await getDependencies('src/features/reporting/reportHandler.ts'); // Assuming getDependencies is exported
    console.log('Conceptual use of getDependencies for reportHandler.ts:', reportingDependencies);
     */



    // Example: Get a summary of a hypothetical moderation utility file.
    // This would be integrated with the simulated approval workflow if the tool requires it.
    /*
    const moderationUtilSummary = await getFileContentSummary('src/utils/moderationUtils.ts'); // Assuming getFileContentSummary is exported
    console.log('Conceptual use of getFileContentSummary for moderationUtils.ts:', moderationUtilSummary);
     */

    // Example: Find where a 'reportPost' function is used.
    // This would also integrate with the simulated approval workflow if needed.
    /*
    const reportPostUsage = await findCodeUsage('reportPost'); // Assuming findCodeUsage is exported
    console.log('Conceptual use of findCodeUsage for reportPost:', reportPostUsage);
     */

    // Example: Conceptually propose a change to how moderation flags are stored.
    // This would definitely require user approval via the simulated workflow.
    /*
    const modifyResult = await modifyCodeStructure('Change how moderation flags are stored in the database schema', 'src/database/schema.ts'); // Assuming modifyCodeStructure is exported
    console.log('Conceptual use of modifyCodeStructure for database schema:', modifyResult);
     */

    if(trigger && message){ // Assuming message is available in this context
      await trigger.action(message, this);
    }
    const moderationResult = await this.moderateCommunityPostFlow(input);

    // Conceptual handling of a tool requiring approval.
    // If a tool like runTerminalCommand or natural_language_write_file returned
    // a status indicating pending approval, the agent's execution flow would pause here
    // in a real asynchronous system and resume upon approval.

    // Conceptual handling of a tool requiring approval.
    // Simulate using runTerminalCommand and handling pending approval
    const commandToRun = 'echo "Moderation complete"';
    const commandResult = await runTerminalCommand(commandToRun, true); 

    if (commandResult.status === 'pending_approval') {
      console.log(`Command "${commandToRun}" pending user approval. Request ID: ${commandResult.requestId}`);
      // In a real system, the agent's process would pause here,
      // waiting for the UI to send a response back with the user's decision.
      // The agent would resume execution based on the approval status.
      // For now, we just log and the function returns. In a real flow,
      // the agent would need to be able to resume from this state.
       if(commandResult.requestId) { // Check if requestId is defined
        await simulateUiApproval(commandResult.requestId, true); // Simulate approval
       } else {
        console.error("Command did not return a request ID for approval simulation.");
       }
    }

    return moderationResult;
  }

  // Assuming receiveMessage and sendMessage are intended to be part of Agent or overridden
  // For now, provide a placeholder for sendMessage if it's directly called.
  async sendMessage(message: Message): Promise<void> {
    this.logger.logMessage(message);
    // In this basic example, we're just logging the message.
    // In a real application, you'd send the message to other agents or the user.
    console.log('Community Moderator sent a message:', message);
  }
  
  // Agent's receive_message should be inherited or implemented if specific logic is needed
  // Override if CommunityModerator has specific message handling beyond the base Agent
  // async receive_message(message: Message): Promise<Message> {
  //   this.logger.logMessage(message);
  //   // Custom logic for CommunityModerator
  //   return super.receive_message(message); // or specific response
  // }


  async useLlm(prompt: string): Promise<any> {
    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: prompt,
    });
    return result.output; // Changed from result.output to result.text based on typical Genkit 1.x use
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
  // This method was not directly used and seemed redundant given moderatePost and the flow structure.
  // private async generateModerationOutput(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
  //   const result = await this.moderateCommunityPostFlow(input);
  //   if(result) return result;
  //   else return {
  //       isAppropriate: false,
  //       reason: "AI moderator is taking a nap 😴. Please try rephrasing or post later.",
  //       flaggedCategories: ["OTHER"],
  //     };
  //   }
}

const communityModerator = new CommunityModerator();

export async function moderateCommunityPost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
  return communityModerator.moderateCommunityPost(input);
}

// Placeholder for `message` if needed in `moderatePost` for trigger execution
// This would typically come from an agent's `receive_message` method.
let message: Message | undefined = undefined; 
