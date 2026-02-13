import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';

interface TimelineMilestone {
  title: string;
  status: 'pending' | 'submitted' | 'approved' | 'revision_requested' | 'completed';
  amount?: number;
}

interface TimelineGateProps {
  milestones: TimelineMilestone[];
  className?: string;
}

export function TimelineGate({ milestones, className }: TimelineGateProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {milestones.map((milestone, idx) => {
        const isCompleted = milestone.status === 'completed' || milestone.status === 'approved';
        const isActive = milestone.status === 'submitted' || milestone.status === 'revision_requested';
        const isLast = idx === milestones.length - 1;

        return (
          <div key={idx} className="flex items-start gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-3 h-3 rounded-full border-2 shrink-0 mt-1',
                  isCompleted && 'bg-emerald-500 border-emerald-500',
                  isActive && 'bg-blue-500 border-blue-500',
                  !isCompleted && !isActive && 'bg-white border-gray-300'
                )}
              />
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 h-12',
                    isCompleted ? 'bg-emerald-300' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
            {/* Content */}
            <div className="pb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{milestone.title}</span>
                <StatusBadge status={milestone.status} />
              </div>
              {milestone.amount !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {`₩${milestone.amount.toLocaleString('ko-KR')}`}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
