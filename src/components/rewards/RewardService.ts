import { Reward } from '@/types/reward';
import { openDatabase } from '@/lib/database';

/**
 * Manages all logic related to rewards in the application.
 */
class RewardService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    this.db = await openDatabase();
  }

  /**
   * Creates a new reward.
   * @param reward - The reward data without id and isUnlocked.
   * @returns The newly created reward.
   */
  async createReward(reward: Omit<Reward, 'id' | 'isUnlocked'>): Promise<Reward> {
    const newReward: Reward = {
      id: this.generateId(),
      isUnlocked: false,
      ...reward,
    };

    const tx = this.db!.transaction('rewards', 'readwrite');
    const store = tx.objectStore('rewards');
    store.add(newReward);
    await tx.done;

    return newReward;
  }

  /**
   * Updates an existing reward.
   * @param id - The ID of the reward to update.
   * @param updatedReward - The updated reward data.
   * @returns The updated reward, or null if not found.
   */
  async updateReward(id: string, updatedReward: Partial<Reward>): Promise<Reward | null> {
    const tx = this.db!.transaction('rewards', 'readwrite');
    const store = tx.objectStore('rewards');
    const request = store.get(id);
    await tx.done;

    if (!request.result) {
      return null;
    }

    const reward = { ...request.result, ...updatedReward };
    const updateTx = this.db!.transaction('rewards', 'readwrite');
    const updateStore = updateTx.objectStore('rewards');
    updateStore.put(reward);
    await updateTx.done;
    return reward;
  }

  /**
   * Deletes a reward.
   * @param id - The ID of the reward to delete.
   * @returns True if the reward was deleted, false otherwise.
   */
  async deleteReward(id: string): Promise<boolean> {
    const tx = this.db!.transaction('rewards', 'readwrite');
    const store = tx.objectStore('rewards');
    const request = store.delete(id);
    await tx.done;
    return true;
  }

  /**
   * Unlocks a reward.
   * @param id - The ID of the reward to unlock.
   * @returns The unlocked reward, or null if not found.
   */
  async unlockReward(id: string): Promise<Reward | null> {
    return await this.updateReward(id,{isUnlocked: true});
  }

  /**
   * Retrieves all rewards.
   * @returns An array of all rewards.
   */
  async getRewards(): Promise<Reward[]> {
    const tx = this.db!.transaction('rewards', 'readonly');
    const store = tx.objectStore('rewards');
    const rewards = await store.getAll();
    return rewards;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

}

export default RewardService;
