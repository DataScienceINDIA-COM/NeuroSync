import { Leaf } from 'lucide-react';

export function Header() {
  return (
    <header className="py-6 px-4 md:px-6 border-b border-border/50">
      <div className="container mx-auto flex items-center gap-3">
        <Leaf className="h-8 w-8 text-accent" />
        <h1 className="text-3xl font-bold text-foreground">Mood Balance</h1>
      </div>
    </header>
  );
}
