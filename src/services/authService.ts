
"use client";

import { auth } from '@/lib/firebase'; // googleAuthProvider removed
import { signOut, type AuthError } from 'firebase/auth'; // signInWithPopup and UserCredential removed

interface AuthServiceResponse {
  success: boolean;
  error?: AuthError;
  message?: string;
}

/**
 * Signs out the current user from Firebase Authentication.
 * @returns A promise that resolves with the sign-out response.
 */
export async function signOutUser(): Promise<AuthServiceResponse> {
  if (!auth) {
    return { success: false, message: "Authentication service not ready." };
  }
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Sign Out Error:", error);
    return { success: false, error: error as AuthError, message: (error as AuthError).message };
  }
}
