
"use client"; // Assuming this service might be used by client components or actions called from client

import type { Integration, IntegrationPlatform, SyncedActivityData } from "@/types/integration";
import { generateId } from "@/lib/utils";

const INTEGRATIONS_STORAGE_KEY_PREFIX = "neuroSyncIntegrations_";

class IntegrationService {
  private userId: string | null = null;
  private integrations: Integration[] = [];

  constructor(userId?: string) {
    if (userId) {
      this.userId = userId;
      this.loadIntegrations();
    }
  }

  private getStorageKey(): string | null {
    return this.userId ? `${INTEGRATIONS_STORAGE_KEY_PREFIX}${this.userId}` : null;
  }

  private loadIntegrations(): void {
    if (typeof window !== "undefined" && this.userId) {
      const storageKey = this.getStorageKey();
      if (storageKey) {
        const storedIntegrations = localStorage.getItem(storageKey);
        if (storedIntegrations) {
          try {
            this.integrations = JSON.parse(storedIntegrations);
          } catch (error) {
            console.error("Failed to parse integrations from localStorage", error);
            this.integrations = [];
          }
        }
      }
    }
  }

  private saveIntegrations(): void {
    if (typeof window !== "undefined" && this.userId) {
       const storageKey = this.getStorageKey();
       if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(this.integrations));
       }
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    this.loadIntegrations();
  }

  /**
   * Placeholder for initiating connection to an external platform.
   * In a real app, this would involve OAuth flows.
   * @param platform The platform to connect to.
   * @returns A promise that resolves with the connected integration or null if failed.
   */
  public async connectPlatform(platform: IntegrationPlatform): Promise<Integration | null> {
    if (!this.userId) {
      console.error("User ID not set. Cannot connect platform.");
      return null;
    }
    console.log(`Simulating connection to ${platform} for user ${this.userId}...`);

    // Simulate OAuth flow and getting tokens/scopes
    const newIntegration: Integration = {
      id: generateId(),
      userId: this.userId,
      platform,
      accessToken: `fake_access_token_${platform}_${generateId()}`,
      refreshToken: `fake_refresh_token_${platform}_${generateId()}`,
      scopes: ["read_activity", "read_sleep"], // Example scopes
      status: "connected",
      lastSync: new Date().toISOString(),
    };

    // Check if already connected
    const existingIntegration = this.integrations.find(int => int.platform === platform);
    if (existingIntegration) {
      console.warn(`${platform} is already connected.`);
      // Optionally update existing integration details
      Object.assign(existingIntegration, newIntegration, {id: existingIntegration.id});
    } else {
      this.integrations.push(newIntegration);
    }
    
    this.saveIntegrations();
    console.log(`${platform} connected successfully for user ${this.userId}.`);
    return newIntegration;
  }

  /**
   * Disconnects a platform for the current user.
   * @param platform The platform to disconnect.
   * @returns A promise that resolves to true if disconnection was successful.
   */
  public async disconnectPlatform(platform: IntegrationPlatform): Promise<boolean> {
    if (!this.userId) {
      console.error("User ID not set. Cannot disconnect platform.");
      return false;
    }
    const initialLength = this.integrations.length;
    this.integrations = this.integrations.filter(
      (integration) => integration.platform !== platform
    );
    if (this.integrations.length < initialLength) {
      this.saveIntegrations();
      console.log(`${platform} disconnected for user ${this.userId}.`);
      return true;
    }
    console.warn(`${platform} was not connected for user ${this.userId}.`);
    return false;
  }

  /**
   * Retrieves all connected integrations for the current user.
   * @returns An array of connected integrations.
   */
  public getConnectedIntegrations(): Integration[] {
    return [...this.integrations];
  }

  /**
   * Placeholder for syncing data from a specific connected platform.
   * @param platform The platform to sync data from.
   * @returns A promise that resolves with an array of synced data or null if failed.
   */
  public async syncData(platform: IntegrationPlatform): Promise<SyncedActivityData[] | null> {
     if (!this.userId) {
      console.error("User ID not set. Cannot sync data.");
      return null;
    }
    const integration = this.integrations.find(int => int.platform === platform && int.status === "connected");
    if (!integration) {
      console.error(`Cannot sync: ${platform} is not connected or has an error.`);
      return null;
    }

    console.log(`Simulating data sync from ${platform} for user ${this.userId}...`);
    // In a real app, this would make API calls to the platform using the accessToken.
    // For now, return mock data.
    const mockData: SyncedActivityData[] = [
      { platform, type: "steps", value: Math.floor(Math.random() * 5000) + 5000, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
      { platform, type: "sleep", value: (Math.random() * 3 + 5).toFixed(1), startDate: new Date(Date.now() - 86400000).toISOString(), endDate: new Date().toISOString() },
    ];
    
    integration.lastSync = new Date().toISOString();
    this.saveIntegrations();
    
    console.log(`Data synced from ${platform}.`);
    return mockData;
  }

  /**
   * Placeholder for fetching all synced data across all connected platforms.
   * @returns A promise that resolves with an array of all synced data.
   */
  public async getAllSyncedData(): Promise<SyncedActivityData[]> {
     if (!this.userId) {
      console.error("User ID not set. Cannot get all synced data.");
      return [];
    }
    let allData: SyncedActivityData[] = [];
    for (const integration of this.integrations) {
      if (integration.status === "connected") {
        const platformData = await this.syncData(integration.platform); // Could also retrieve from a local cache/DB
        if (platformData) {
          allData = [...allData, ...platformData];
        }
      }
    }
    return allData;
  }
}

export default IntegrationService;
