// Placeholder for tools/logger.ts
// This file provides placeholder implementations for Logger-related functionalities.

import type { Message } from './message'; // Assuming Message might be logged

export class Logger {
    private messages: Array<Message | string> = [];

    constructor(private context?: string) {
        // Initialization logic for logger, if any
    }

    log(message: string, ...optionalParams: any[]): void {
        const logMessage = this.context ? `[${this.context}] ${message}` : message;
        console.log(logMessage, ...optionalParams);
        this.messages.push(message); // Store simple string messages for now
    }

    error(message: string, ...optionalParams: any[]): void {
        const errorMessage = this.context ? `[${this.context}] ERROR: ${message}` : `ERROR: ${message}`;
        console.error(errorMessage, ...optionalParams);
        this.messages.push(`ERROR: ${message}`);
    }
    
    warn(message: string, ...optionalParams: any[]): void {
        const warnMessage = this.context ? `[${this.context}] WARN: ${message}` : `WARN: ${message}`;
        console.warn(warnMessage, ...optionalParams);
        this.messages.push(`WARN: ${message}`);
    }

    logMessage(messageInstance: Message): void {
        // For logging structured Message objects if needed
        console.log(`[Message Log - ${this.context || 'Global'}] Sender: ${messageInstance.sender}, Receiver: ${messageInstance.receiver}, Type: ${messageInstance.type}, Content:`, messageInstance.content);
        this.messages.push(messageInstance);
    }

    getMessages(): Array<Message | string> {
        return [...this.messages];
    }
}

// Maintains a global/singleton instance of Logger, adjust if multiple independent loggers are needed.
let globalLoggerInstance: Logger | null = null;

export function getLogger(context?: string): Logger {
    // For simplicity, returning a new logger or a shared one.
    // A more sophisticated system might manage multiple logger instances by context.
    if (!globalLoggerInstance) {
        globalLoggerInstance = new Logger(context || 'Default');
    }
    // If context is provided and different from global, could return a new instance or update context.
    // For now, let's stick to a single shared logger for simplicity of placeholder.
    return globalLoggerInstance;
}

// Default logger instance
export const logger = getLogger();