import type { User as FirebaseUser } from 'firebase/auth';
import { Sparkles, LogIn, LogOut } from 'lucide-react'; // Changed icon to Sparkles for more "vibe"
import { Button } from '@/components/ui/button';

interface AuthSectionProps {
  authUser: FirebaseUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

const AuthSection: React.FC<AuthSectionProps> = ({ authUser, onSignIn, onSignOut }) => {
  return authUser ? (
    <Button variant="outline" size="sm" onClick={onSignOut} className="shadow-sm hover:shadow">
      <LogOut className="mr-2 h-4 w-4" /> Sign Out
    </Button>
  ) : (
    <Button onClick={onSignIn} className="text-primary-foreground bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
      <svg className="mr-2 -ml-1 w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
      Sign In
    </Button>
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
