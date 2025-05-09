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
    if (response.content.requestId) {
      await simulateUiApproval(response.content.requestId, true); // Simulate user approving the request
    }
    // Re-send the message or have the agent re-trigger the command internally after simulated approval
    response = await taskSuggester.receive_message(message); // Re-sending the original message or checking for status update
  }

  if (!response || !response.content || !response.content.output) {
     console.error("Task suggester did not return valid output.", response);
     return { 
       suggestions: [
          { name: "Default: Chill Sesh", description: "Take 5 mins to just breathe. You got this!", hasNeuroBoost: true },
          { name: "Default: Quick Connect", description: "Send a positive vibe to a friend!", hasNeuroBoost: false },
       ]
     }; // Fallback to empty suggestions
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
      const response = await agent.use_llm(`There is a new mood log, ${JSON.stringify(message.content)}. Is there any new tasks that I should suggest?`);
      if (response?.text?.toLocaleLowerCase().includes("yes")) {
        const output = await taskSuggestionsFlow(message.content.input); // Assuming input is part of message.content
        const newMessageContent = { output };
        return createMessage(agent.name, message.sender, MessageType.OBSERVATION, newMessageContent);
      }
      return createMessage(agent.name, message.sender, MessageType.OBSERVATION, { message: "No new tasks needed." });
    });
    const trigger2 = createTrigger("2", "Information Requested", MessageType.REQUEST_INFORMATION, async (message: Message, taskSuggesterAgent: Agent) => {
      const output = await taskSuggestionsFlow(message.content.input);
      const newMessageContent = { output };
      return createMessage(taskSuggesterAgent.name, message.sender, MessageType.OBSERVATION, newMessageContent);
    });
    taskSuggester.add_trigger(trigger1);
    taskSuggester.add_trigger(trigger2);

  }
  return taskSuggester;
}

const taskSuggestionsFlow = ai.defineFlow(
  {
    name: 'taskSuggestionsFlow',
    inputSchema: TaskSuggestionsInputSchema,
    outputSchema: TaskSuggestionsOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      try {
        const { output, finishReason, usage } = await ai.generate({
          prompt: `You are a fun, GenZ-style AI assistant helping a user find cool tasks to do.
          Based on the user's mood logs, hormone levels, and recently completed tasks, suggest 2 to 3 new tasks.
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

          Suggest 2 to 3 tasks now.
          The tasks MUST align with the app's GenZ wellness theme.
            Include tasks related to:
            - Mindfulness: activities that focus on being present and aware.
            - Social Connection: tasks that encourage interaction and bonding with others.
            - Physical Activity: any form of movement that gets the body going.
            - Creative Expression: activities that allow for creativity and imagination.
            - Learning: acquiring new skills or knowledge.
          Examples (for structure, not direct copying):
          - Name: "Zen Zone Entry"
            Description: "Take 5 deep breaths and notice how you feel. Super simple W."
            hasNeuroBoost: true
          - Name: "Friend Vibe Check"
            Description: "Hit up a bestie and see how they're doing. Spread that good energy!"
            hasNeuroBoost: false
          - Name: "Creative Burst"
            Description: "Doodle, write a poem, or edit a quick pic. Unleash your inner artist."
            hasNeuroBoost: true
          
          Provide the output as a JSON object matching the defined schema.
          `,
          model: 'googleai/gemini-2.0-flash',
          input: input, 
          output: {
            schema: TaskSuggestionsOutputSchema, 
          },
          config: { 
            temperature: 0.7, 
          }
        });

        if (finishReason !== 'stop' && finishReason !== 'length' && finishReason !== 'blocked') {
            console.warn(`Task suggestion generation finished due to ${finishReason}. Output may be incomplete.`);
        }
        
        if (!output || !output.suggestions || output.suggestions.length === 0) {
          console.error("Failed to generate or parse AI response for task suggestions. Output:", output, "Usage:", usage);
          return { 
            suggestions: [
              { name: "Mindful Meditation", description: "Take 10 minutes to practice mindful meditation and center yourself. #Zen", hasNeuroBoost: true },
              { name: "Connect with a Friend", description: "Reach out to a friend and catch up. Good vibes only. 🤙", hasNeuroBoost: false },
            ]
          };
        }
        
        return output;

      } catch (error: any) {
        attempts++;
        console.error(`Attempt ${attempts} failed for taskSuggestionsFlow: ${error.message}`);
        if (error.status === 'GEMINI_RESOURCE_EXHAUSTED' || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
          if (attempts < maxAttempts) {
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            console.error(`Max retry attempts (${maxAttempts}) reached. Giving up on AI suggestions.`);
            // Fallback to default suggestions after max retries
            return { 
              suggestions: [
                { name: "Default: Quick Sketch", description: "Doodle something for 5 mins. No pressure, just vibes.", hasNeuroBoost: true },
                { name: "Default: Gratitude Moment", description: "Think of one thing you're grateful for today.", hasNeuroBoost: false },
              ]
            };
          }
        } else {
           // For non-retryable errors, provide a fallback immediately.
           console.error("Non-retryable error in taskSuggestionsFlow. Providing fallback.");
           return { 
            suggestions: [
              { name: "Fallback: Hydration Check", description: "Sip some water, stay hydrated, queen/king!", hasNeuroBoost: false },
              { name: "Fallback: Screen Break", description: "Look away from your screen for 2 mins. Your eyes will thank you.", hasNeuroBoost: false },
            ]
          };
        }
      }
    }
    // This part should ideally not be reached if maxAttempts are exhausted and error is re-thrown or fallback provided.
    // Providing a final fallback if loop finishes without returning/throwing.
    console.error("Task suggestions flow exhausted attempts or had an unexpected exit.");
    return { 
      suggestions: [
        { name: "Ultimate Fallback: Vibe Check", description: "Take a deep breath. You're doing great!", hasNeuroBoost: true },
      ]
    };
  }
);
