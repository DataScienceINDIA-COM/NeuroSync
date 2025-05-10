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

/**
 * Fetches the user's onboarding status from Firestore.
 * @param userId The ID of the user.
 * @returns A promise that resolves with the onboarding status or null if an error occurs or user is a guest.
 */
export async function getUserOnboardingStatusAction(userId: string): Promise<{ onboardingCompleted: boolean } | null> {
  if (adminInitError) {
    console.error('Firebase Admin SDK not initialized. Cannot get onboarding status.', adminInitError.message);
    return null;
  }
  if (!adminDb) {
    console.error('Firebase Admin Firestore not available. Cannot get onboarding status.');
    return null;
  }

  if (!userId || userId.startsWith('guest_')) {
    // No server-side persisted onboarding status for guest users.
    // This will be handled client-side by AuthContext using localStorage.
    return { onboardingCompleted: false }; // Or based on local if that's the desired flow for guests initializing
  }

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      return { onboardingCompleted: data?.onboardingCompleted || false };
    }
    // If user document doesn't exist in Firestore yet, assume onboarding is not completed.
    return { onboardingCompleted: false };
  } catch (error) {
    console.error('Error fetching onboarding status from Firestore for user:', userId, error);
    // Fallback to false if there's an error, rather than null, to avoid breaking UI expectations
    // or consider returning null and let the client decide how to handle the error (e.g., retry or use local).
    // For now, returning a default state is safer for immediate UI consistency.
    return { onboardingCompleted: false }; 
  }
}
