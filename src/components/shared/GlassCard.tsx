import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-md border-white/20 shadow-[0_2px_16px_rgba(0,0,0,0.06)]',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export { CardContent as GlassCardContent, CardHeader as GlassCardHeader, CardTitle as GlassCardTitle, CardDescription as GlassCardDescription, CardFooter as GlassCardFooter };
