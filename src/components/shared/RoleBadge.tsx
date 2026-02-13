import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Role = 'client' | 'creator' | 'admin';

const roleConfig: Record<Role, { label: string; className: string }> = {
  client: { label: '의뢰인', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  creator: { label: '크리에이터', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  admin: { label: '관리자', className: 'bg-red-50 text-red-700 border-red-200' },
};

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
