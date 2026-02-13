import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JellyButtonProps extends ButtonProps {
  gradient?: 'peach' | 'serenity' | 'mixed';
}

const gradientMap = {
  peach: 'from-peach-400 to-peach-500',
  serenity: 'from-serenity-400 to-serenity-500',
  mixed: 'from-peach-400 to-serenity-400',
} as const;

export function JellyButton({ children, className, gradient = 'mixed', ...props }: JellyButtonProps) {
  return (
    <Button
      className={cn(
        'rounded-[1rem] bg-gradient-to-r text-white font-semibold',
        'hover:scale-[1.03] active:scale-[0.98] transition-all duration-200',
        'shadow-lg hover:shadow-xl',
        gradientMap[gradient],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
