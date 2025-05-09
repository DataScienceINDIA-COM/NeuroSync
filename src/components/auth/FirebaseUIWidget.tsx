'use client';

import type { User } from 'firebase/auth';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { auth } from '@/lib/firebase';
import type firebaseui from 'firebaseui';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // For potential redirection

// FirebaseUI will be dynamically imported on the client-side
let ui: firebaseui.auth.AuthUI | null = null;

interface FirebaseUIWidgetProps {
  onSignInSuccess?: (authResult: any, redirectUrl?: string | null) => boolean;
  uiConfig?: firebaseui.auth.Config;
}

const FirebaseUIWidget: React.FC<FirebaseUIWidgetProps> = ({ onSignInSuccess, uiConfig: customUiConfig }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadFirebaseui = async () => {
      // Dynamically import firebaseui
      const firebaseuiModule = await import('firebaseui');
      // Ensure auth is initialized before creating AuthUI instance
      if (!auth) {
        console.error("Firebase Auth instance is not available. FirebaseUI cannot be initialized.");
        toast({
          title: "Initialization Error",
          description: "Firebase authentication service is not ready. Please refresh or check console.",
          variant: "destructive",
        });
        return;
      }
      ui = firebaseuiModule.auth.AuthUI.getInstance() || new firebaseuiModule.auth.AuthUI(auth); 

      if (elementRef.current && !userLoggedIn) {
        const finalUiConfig: firebaseui.auth.Config = customUiConfig || {
          signInFlow: 'popup', 
          signInOptions: [
            GoogleAuthProvider.PROVIDER_ID,
            EmailAuthProvider.PROVIDER_ID,
          ],
          callbacks: {
            signInSuccessWithAuthResult: (authResult, redirectUrl) => {
              setUserLoggedIn(true);
              toast({
                title: "Signed In! 🎉",
                description: "Welcome back! You're now logged in.",
              });
              if (onSignInSuccess) {
                return onSignInSuccess(authResult, redirectUrl);
              }
              return false; 
            },
            signInFailure: (error) => {
              console.error('FirebaseUI Sign-In Error:', error);
              if (error.code === 'auth/configuration-not-found') {
                toast({
                  title: "Firebase Config Issue ⚙️",
                  description: "Sign-in method not enabled. Please enable Google and Email/Password sign-in in your Firebase project console (Authentication > Sign-in method). Then, ensure your .env.local file is correct and restart the app.",
                  variant: "destructive",
                  duration: 15000, // Longer duration for important messages
                });
              } else {
                toast({
                  title: "Sign-In Glitch 😬",
                  description: error.message || `Couldn't sign you in. Error code: ${error.code}`,
                  variant: "destructive",
                });
              }
              return Promise.resolve(); 
            },
            uiShown: () => {
              // Loader can be hidden here
            }
          },
          // tosUrl: '/terms-of-service', // Optional
          // privacyPolicyUrl: '/privacy-policy', // Optional
          credentialHelper: firebaseuiModule.auth.CredentialHelper.GOOGLE_YOLO, 
        };
        
        try {
            ui.start(elementRef.current, finalUiConfig);
        } catch (e: any) {
            console.error("Error starting FirebaseUI:", e);
            toast({
                title: "FirebaseUI Start Error",
                description: `Could not display sign-in options: ${e.message}. Check console.`,
                variant: "destructive"
            });
        }
      }
    };
    
    loadFirebaseui();

    return () => {
      if (ui) {
        try {
            ui.reset(); 
        } catch (e) {
            console.warn("Error resetting FirebaseUI:", e);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customUiConfig, onSignInSuccess, userLoggedIn, toast]); // Added toast to dependency array

  if (userLoggedIn) {
    return (
        <div className="text-center p-4">
            <p className="text-muted-foreground">Authenticating...</p>
        </div>
    );
  }

  return <div id="firebaseui-auth-container" ref={elementRef} className="max-w-md mx-auto" />;
};

export default FirebaseUIWidget;
