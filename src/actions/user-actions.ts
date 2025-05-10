'use server';

import { adminDb, adminInitError } from '@/lib/firebase-admin';
import admin from 'firebase-admin'; // Ensure admin is imported if FieldValue is used directly

/**
 * Updates the user's onboarding status in Firestore.
 * @param userId The ID of the user.
 * @returns A promise that resolves with the success status.
 */
export async function completeOnboardingAction(userId: string): Promise<{ success: boolean; message?: string }> {
  if (adminInitError) {
    console.error('Firebase Admin SDK not initialized. Cannot complete onboarding.', adminInitError.message);
    return { success: false, message: 'Firebase Admin SDK not initialized.' };
  }
  if (!adminDb) {
    console.error('Firebase Admin Firestore not available. Cannot complete onboarding.');
    return { success: false, message: 'Firebase Admin Firestore not available.' };
  }

  if (!userId || userId.startsWith('guest_')) {
    // For guest users, onboarding status is typically client-side or not persisted long-term.
    // Or, if you want to track guest onboarding differently, handle here.
    // For now, we'll say it's successful for guests without a DB write.
    console.log(`Onboarding completed for guest user ${userId} (client-side).`);
    return { success: true, message: 'Guest onboarding completed (client-side).' };
  }

  try {
    await adminDb.collection('users').doc(userId).set(
      {
        onboardingCompleted: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`Onboarding completed and marked in Firestore for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error marking onboarding as completed in Firestore:', error);
    return { success: false, message: 'Failed to update onboarding status in Firestore.' };
  }
}
