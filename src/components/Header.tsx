import type { User as FirebaseUser } from 'firebase/auth';
import { Sparkles, LogOut } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface AuthSectionProps {
  authUser: FirebaseUser | null;
  onSignOut: () => void;
}

const AuthSection: React.FC<AuthSectionProps> = ({ authUser, onSignOut }) => {
  return authUser ? (
    <Button variant="outline" size="sm" onClick={onSignOut} className="shadow-sm hover:shadow">
      <LogOut className="mr-2 h-4 w-4" /> Sign Out
    </Button>
  ) : null; 
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
          {/* Placeholder for Pixar-level avatar animation */}
          {/* TODO: Replace this placeholder with the actual complex animation component */}
          <div className="relative h-[50px] w-[200px] md:h-[60px] md:w-[250px]">
            <Image
              src="https://picsum.photos/250/60"
              alt="Vibing Avatars Animation Placeholder"
              layout="fill"
              objectFit="contain"
              data-ai-hint="avatars animation"
            />
          </div>
        </div>
        {children} 
      </div>
    </header>
  );
}

Header.AuthSection = AuthSection;
