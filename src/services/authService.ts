
"use client";

import { auth, googleAuthProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, type UserCredential, type AuthError } from 'firebase/auth';

interface AuthServiceResponse {
  success: boolean;
  user?: UserCredential["user"];
  error?: AuthError;
  message?: string;
}

/**
 * Signs in the user with Google using Firebase Authentication.
 * @returns A promise that resolves with the sign-in response.
 */
export async function signInWithGoogle(): Promise<AuthServiceResponse> {
  if (!auth) {
    return { success: false, message: "Authentication service not ready." };
  }
  try {
    const userCredential = await signInWithPopup(auth, googleAuthProvider);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    return { success: false, error: error as AuthError, message: (error as AuthError).message };
  }
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
