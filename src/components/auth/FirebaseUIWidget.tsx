
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
      ui = firebaseuiModule.auth.AuthUI.getInstance() || new firebaseuiModule.auth.AuthUI(auth); // Use existing instance or create new

      if (elementRef.current && !userLoggedIn && auth) {
        const finalUiConfig: firebaseui.auth.Config = customUiConfig || {
          signInFlow: 'popup', // Or 'redirect'
          signInOptions: [
            GoogleAuthProvider.PROVIDER_ID,
            EmailAuthProvider.PROVIDER_ID,
            // Add other providers like Facebook, Twitter, GitHub, etc.
            // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            // firebase.auth.GithubAuthProvider.PROVIDER_ID,
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
              // If onSignInSuccess doesn't handle redirection (returns true),
              // FirebaseUI will not redirect. We can handle it here if needed.
              // For example, router.push('/dashboard');
              return false; // Prevent FirebaseUI from redirecting, we handle it or AuthContext does.
            },
            signInFailure: (error) => {
              console.error('FirebaseUI Sign-In Error:', error);
              toast({
                title: "Sign-In Glitch 😬",
                description: error.message || `Couldn't sign you in. Error code: ${error.code}`,
                variant: "destructive",
              });
              return Promise.resolve(); // Or Promise.reject(error) if you want to propagate
            },
            uiShown: () => {
              // This is called when the UI is shown.
              // You can hide a loader here if you have one.
            }
          },
          // tosUrl and privacyPolicyUrl are optional.
          // tosUrl: '/terms-of-service',
          // privacyPolicyUrl: '/privacy-policy',
          credentialHelper: firebaseuiModule.auth.CredentialHelper.GOOGLE_YOLO, // Or NONE, ACCOUNT_CHOOSER_COM
        };
        
        ui.start(elementRef.current, finalUiConfig);
      }
    };
    
    loadFirebaseui();

    // Cleanup function
    return () => {
      if (ui) {
        ui.reset(); // Reset FirebaseUI instance
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customUiConfig, onSignInSuccess, userLoggedIn]); // Rerun if config changes or user logs in/out

  // If user is logged in, perhaps show nothing or a loading indicator while AuthContext updates
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
