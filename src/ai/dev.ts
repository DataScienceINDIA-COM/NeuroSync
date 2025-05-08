
import { config } from 'dotenv';
config();

// Flows
import '@/ai/flows/personalized-insights';
import '@/ai/flows/generate-avatar-flow';
import '@/ai/flows/recommended-content';
import '@/ai/flows/task-suggestions';
import '@/ai/flows/community-challenges-flow'; // Added new flow

// Tools
import '@/ai/tools/calculate-reward-points';
