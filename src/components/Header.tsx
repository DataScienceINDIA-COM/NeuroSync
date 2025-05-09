import type { User as FirebaseUser } from 'firebase/auth';
import { Sparkles, LogOut } from 'lucide-react'; // Changed icon to Sparkles for more "vibe", LogIn removed
import { Button } from '@/components/ui/button';

interface AuthSectionProps {
  authUser: FirebaseUser | null;
  onSignOut: () => void;
  // onSignIn prop is removed as FirebaseUI will handle showing the sign-in options.
}

const AuthSection: React.FC<AuthSectionProps> = ({ authUser, onSignOut }) => {
  return authUser ? (
    <Button variant="outline" size="sm" onClick={onSignOut} className="shadow-sm hover:shadow">
      <LogOut className="mr-2 h-4 w-4" /> Sign Out
    </Button>
  ) : (
    // If not authenticated, the main page will show FirebaseUI.
    // The header might not need a sign-in button, or it could navigate to a dedicated auth page.
    // For this iteration, we'll remove the sign-in button from the header if the user is not authenticated,
    // as the sign-in options will be presented on the main page content area.
    null 
  );
};

interface HeaderProps {
  children?: React.ReactNode; 
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="py-6 px-4 md:px-6 border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">Vibe Check</h1>
        </div>
        {children} 
      </div>
    </header>
  );
}

Header.AuthSection = AuthSection;
