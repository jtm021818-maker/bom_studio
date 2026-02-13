import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 px-6 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-peach-500 to-serenity-500 bg-clip-text text-transparent">
            봄결 스튜디오
          </h1>
          {/* Nav items will be added in later tasks */}
          <nav className="flex items-center gap-4">
            {/* Placeholder for auth buttons */}
          </nav>
        </div>
      </header>
      <main className={cn('flex-1 container mx-auto px-6 py-8', className)}>
        {children}
      </main>
      <footer className="border-t border-white/20 bg-white/40 backdrop-blur-sm py-4 px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; 2026 봄결 스튜디오. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
