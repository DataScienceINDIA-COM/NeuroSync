
export type AgentProfile = {
  id: string;
  name: string;
  description: string;
  avatarImageUrl?: string; // Optional, as not all agents might have one
  personaPrompt?: string; // For LLM priming, to guide its responses
};
