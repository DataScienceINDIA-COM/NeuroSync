
export type IntegrationPlatform = "fitbit" | "googlefit" | "applehealth" | "strava";

export interface Integration {
  id: string; // Unique identifier for the integration instance
  userId: string; // User this integration belongs to
  platform: IntegrationPlatform;
  accessToken: string; // Store securely, consider encryption or server-side storage
  refreshToken?: string; // For refreshing access tokens
  lastSync?: string; // ISO date string of the last successful sync
  scopes: string[]; // Permissions granted by the user
  status: "connected" | "disconnected" | "error";
  errorDetails?: string; // Details if status is 'error'
}

// Example: Data structure for synced activity
export interface SyncedActivityData {
  platform: IntegrationPlatform;
  type: "steps" | "sleep" | "heart_rate" | "workout";
  value: number | string; // e.g., 10000 steps, 7.5 hours, 65 bpm
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  sourceId?: string; // Original ID from the platform
}
