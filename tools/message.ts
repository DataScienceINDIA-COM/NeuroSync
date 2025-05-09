// Placeholder for tools/message.ts
// This file provides placeholder implementations for Message-related functionalities
// that Genkit flows in src/ai/flows/* might be trying to import.
// The original project structure suggests these might have been intended as Python tools,
// but TypeScript flows require TypeScript modules.

export enum MessageType {
    REQUEST_INFORMATION = "REQUEST_INFORMATION",
    OBSERVATION = "OBSERVATION",
    SUGGESTION = "SUGGESTION",
    ALERT = "ALERT",
    // Add other types if used by flows
}

export interface MessageContent {
    input?: any;
    output?: any;
    message?: string;
    [key: string]: any; // Allow other properties
}

export class Message {
    constructor(
        public sender: string,
        public receiver: string,
        public type: MessageType,
        public content: MessageContent
    ) {}
}

export function createMessage(sender: string, receiver: string, type: MessageType, content: MessageContent): Message {
    return new Message(sender, receiver, type, content);
}
