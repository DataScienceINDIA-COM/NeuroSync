
'use server';

import { calculateRewardPoints, type CalculateRewardPointsInput, type CalculateRewardPointsOutput } from '@/ai/tools/calculate-reward-points';

export async function calculateTaskRewardPointsAction(input: CalculateRewardPointsInput): Promise<CalculateRewardPointsOutput> {
  try {
    const points = await calculateRewardPoints(input);
    return points;
  } catch (error) {
    console.error('Error in calculateTaskRewardPointsAction:', error);
    // Fallback to a default value or rethrow a more specific error
    return 15; // Default points on error
  }
}
