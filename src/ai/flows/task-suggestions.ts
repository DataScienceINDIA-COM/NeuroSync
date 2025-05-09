
'use server';

import { ai } from '@/ai/genkit';
import { Memory, getMemory } from '@/tools/memory';
import { Message, MessageType, createMessage } from '@/tools/message';
import { Agent, getAgent, createAgent } from '@/tools/agent';
import { simulateUiApproval } from '@/tools/tools'; 
import { z } from 'genkit';
import { Trigger, createTrigger } from '@/tools/trigger';

const TaskSuggestionsInputSchema = z.object({
  moodLogs: z.array(z.object({
    date: z.string(),
    mood: z.string(),
    activities: z.array(z.string()),
    notes: z.string().optional(),
  })).describe('An array of mood logs.'),
  hormoneLevels: z.object({
    dopamine: z.number(),
    adrenaline: z.number(),
    cortisol: z.number(),
    serotonin: z.number(),
  }).describe('The user\'s current hormone levels.'),
  completedTasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    rewardPoints: z.number(),
    isCompleted: z.boolean(),
    hasNeuroBoost: z.boolean(),
  })).describe('The user\'s completed tasks.'),
});

export type TaskSuggestionsInput = z.infer<typeof TaskSuggestionsInputSchema>;

// This schema is used internally for the output definition
const SuggestedTaskSchema = z.object({
  name: z.string().describe('The name of the suggested task. Should be catchy and GenZ-friendly.'),
  description: z.string().describe('A brief, engaging description of the task, max 2 sentences. GenZ vibe.'),
  // rewardPoints will be calculated by the CalculateRewardPointsTool when the task is formally created
  hasNeuroBoost: z.boolean().describe('Whether the task should have a neuro-boost (true/false). Be creative!'),
});
export type SuggestedTask = z.infer<typeof SuggestedTaskSchema>;


const TaskSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedTaskSchema).describe('An array of suggested tasks with their details (name, description, hasNeuroBoost).'),
});
export type TaskSuggestionsOutput = z.infer<typeof TaskSuggestionsOutputSchema>;


export async function getTaskSuggestions(input: TaskSuggestionsInput, agentId = 'taskSuggester'): Promise<TaskSuggestionsOutput> {
  const memory = getMemory();
  const taskSuggester = await createOrGetTaskSuggesterAgent(agentId, memory);
  const messageContent = { input };
  const message = createMessage("user", agentId, MessageType.REQUEST_INFORMATION, messageContent);

  let response = await taskSuggester.receive_message(message);

  // Simulate waiting for approval if needed
  // In a real system, the agent would wait for a UI response and then proceed or handle rejection based on that response.
  // For simulation, we'll use a simple while loop checking the status.
  while (response && response.status === 'pending_approval') {
    console.log(`Task Suggester: Command pending approval: ${response.content.command}. Please approve.`);
    // For simulation, we'll just log and re-attempt after a short delay (simulated approval).
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate waiting 1 second for approval
    // Conceptually, the agent would now wait for a user interaction in the UI that triggers the approval.
    // For simulation, we'll call the simulateUiApproval tool directly.
    await simulateUiApproval(response.content.requestId, true); // Simulate user approving the request
    // Re-send the message or have the agent re-trigger the command internally after simulated approval
 response = await taskSuggester.receive_message(message); // Re-sending the original message or checking for status update
  }

  return response.content.output;
}


async function createOrGetTaskSuggesterAgent(agentId: string, memory: Memory): Promise<Agent> {
  let taskSuggester = getAgent(agentId);
  if (!taskSuggester) {
    taskSuggester = createAgent(agentId, memory, async (message: Message, agent:Agent) => {
      if (message.type === MessageType.REQUEST_INFORMATION) {
        const output = await taskSuggestionsFlow(message.content.input);
        const newMessageContent = { output };
        return createMessage(agent.name, message.sender, MessageType.OBSERVATION, newMessageContent);
      } else {
        return createMessage(agent.name, message.sender, MessageType.OBSERVATION, { message: "Message type not recognized" });
      }
    });
    
    const trigger1 = createTrigger("1", "new Mood log", "NEW_MOOD_LOG", async (message: Message, agent: Agent) => {
      const response = await agent.use_llm(`There is a new mood log, ${message.content}. Is there any new tasks that I should suggest?`);
      if (response.toLocaleLowerCase().includes("yes")) {
        const output = await taskSuggestionsFlow(message.content.input);
        const newMessageContent = { output };
        return createMessage(agent.name, message.sender, MessageType.OBSERVATION, newMessageContent);
      }
      return createMessage(agent.name, message.sender, MessageType.OBSERVATION, { message: "No new tasks needed." });
    });
    const trigger2 = createTrigger("2", "Information Requested", MessageType.REQUEST_INFORMATION, async (message: Message, taskSuggester: Agent) => {
      const output = await taskSuggestionsFlow(message.content.input);
      const newMessageContent = { output };
      return createMessage(taskSuggester.name, message.sender, MessageType.OBSERVATION, newMessageContent);
    });
    taskSuggester.add_trigger(trigger1);
    taskSuggester.add_trigger(trigger2);



  }
  return taskSuggester;
}

function getTriggeredResponse(taskSuggester:Agent, message: Message) {

    const triggerResponse = taskSuggester.execute_trigger(message.type as string); // Cast message.type to string
    return triggerResponse;
  }

















const taskSuggestionsFlow = ai.defineFlow(
  {
    name: 'taskSuggestionsFlow',
    inputSchema: TaskSuggestionsInputSchema,
    outputSchema: TaskSuggestionsOutputSchema,
  },
  async (input) => {
    const { output, finishReason, usage } = await ai.generate({
      prompt: `You are a fun, GenZ-style AI assistant helping a user find cool tasks to do.
      Based on the user's mood logs, hormone levels, and recently completed tasks, suggest 3 new tasks.
      Each task MUST have a "name", a "description", and a "hasNeuroBoost" (boolean) field.
      Make the tasks sound engaging and relevant to improving well-being or achieving small goals.
      The "name" should be short and catchy. The "description" should be 1-2 sentences.
      
      User's Mood Logs:
      {{#if moodLogs.length}}
      {{#each moodLogs}}
      - Date: {{this.date}}, Mood: {{this.mood}}, Activities: {{#if this.activities.length}}{{this.activities.join ', '}}{{else}}None{{/if}}{{#if this.notes}}, Notes: {{this.notes}}{{/if}}
      {{/each}}
      {{else}}
      No mood logs provided.
      {{/if}}

      User's Hormone Levels (0-100%):
      - Dopamine: {{hormoneLevels.dopamine}}%
      - Adrenaline: {{hormoneLevels.adrenaline}}%
      - Cortisol: {{hormoneLevels.cortisol}}%
      - Serotonin: {{hormoneLevels.serotonin}}%

      User's Recently Completed Tasks:
      {{#if completedTasks.length}}
      {{#each completedTasks}}
      - {{this.name}} ({{this.description}})
      {{/each}}
      {{else}}
      No tasks recently completed.
      {{/if}}

      Suggest 3 tasks now.
      The tasks MUST align with the app's GenZ wellness theme.
        Include tasks related to:
        - Mindfulness: activities that focus on being present and aware.
        - Social Connection: tasks that encourage interaction and bonding with others.
        - Physical Activity: any form of movement that gets the body going.
        - Creative Expression: activities that allow for creativity and imagination.
        - Learning: acquiring new skills or knowledge.
      Examples:
      - Mindfulness:
        - "Meditate with an app for 10 minutes." (hasNeuroBoost: true)
        - "Practice mindful breathing." (hasNeuroBoost: true)
        - "Take a digital detox hour." (hasNeuroBoost: true)
      - Social Connection:
        - "Call a friend to catch up." (hasNeuroBoost: false)
        - "Play a game online with friends." (hasNeuroBoost: false)
        - "Have a meal with family without phones." (hasNeuroBoost: false)
      - Physical Activity:
        - "Do a 15-minute workout video." (hasNeuroBoost: true)
        - "Go for a brisk walk in the park." (hasNeuroBoost: false)
        - "Dance to your favorite playlist for 20 minutes." (hasNeuroBoost: true)
      - Creative Expression:
        - "Sketch or doodle for 15 minutes." (hasNeuroBoost: true)
        - "Write a short poem." (hasNeuroBoost: true)
        - "Take some creative photos." (hasNeuroBoost: true)
      - Learning:
        - "Watch an educational video online." (hasNeuroBoost: true)
        - "Read a chapter of a book." (hasNeuroBoost: true)
        - "Listen to a podcast on a new topic." (hasNeuroBoost: true)
      `,
      model: 'googleai/gemini-2.0-flash',
      input: input, // Pass structured input directly to Handlebars template
      output: {
        schema: TaskSuggestionsOutputSchema, // Expect structured output
      },
      config: { 
        temperature: 0.7, // More creative suggestions
      }
    });

    if (finishReason !== 'stop' && finishReason !== 'length' && finishReason !== 'blocked') {
        console.warn(`Task suggestion generation finished due to ${finishReason}. Output may be incomplete.`);
    }
    
    // The output is already validated by Genkit against TaskSuggestionsOutputSchema
    // If output is null or undefined, it means validation failed or generation failed.
    if (!output || !output.suggestions || output.suggestions.length === 0) {
      console.error("Failed to generate or parse AI response for task suggestions. Output:", output, "Usage:", usage);
      // Fallback if AI fails
      return { 
        suggestions: [
          { name: "Mindful Meditation", description: "Take 10 minutes to practice mindful meditation and center yourself.", hasNeuroBoost: true },
          { name: "Connect with a Friend", description: "Reach out to a friend and catch up. Good vibes only.", hasNeuroBoost: false },
          { name: "Stretch Break", description: "Spend 10 minutes stretching your body. Shake off that stiffness!", hasNeuroBoost: false },
          

        ]
      };
    }
    
    return output;
  }
);
