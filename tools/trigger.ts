// Placeholder for tools/trigger.ts
// This file provides placeholder implementations for Trigger-related functionalities.

import type { Agent } from './agent'; // Agent might be needed in TriggerAction
import type { Message } from './message'; // Message type for action context

// Define the expected signature for an action associated with a trigger
export type TriggerAction = (message: Message, agent: Agent) => Promise<Message | void>;


export class Trigger {
    constructor(
        public id: string,
        public name: string,
        public event: string, // Could be a more specific type like MessageType or a custom event string
        public action: TriggerAction
    ) {}

    // Example method that might be part of a fuller Trigger implementation
    // async execute(message: Message, agent: Agent): Promise<void> {
    //   if (this.condition(message)) { // Optional condition checking
    //     await this.action(message, agent);
    //   }
    // }

    // condition(message: Message): boolean {
    //   // Placeholder for trigger condition logic
    //   return true;
    // }
}

export function createTrigger(
    id: string,
    name: string,
    event: string, // e.g., MessageType.REQUEST_INFORMATION or "NEW_MOOD_LOG"
    action: TriggerAction
): Trigger {
    return new Trigger(id, name, event, action);
}
