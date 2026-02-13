import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'review' | 'completed' | 'cancelled';
type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'revision_requested' | 'completed';
type ProposalStatus = 'pending' | 'accepted' | 'rejected';
type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed';
type Status = ProjectStatus | MilestoneStatus | ProposalStatus | DisputeStatus | 'disputed';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: '초안', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  open: { label: '모집중', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: '진행중', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  review: { label: '검수중', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: '완료', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  cancelled: { label: '취소', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  pending: { label: '대기', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  submitted: { label: '제출됨', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  approved: { label: '승인', className: 'bg-green-50 text-green-700 border-green-200' },
  revision_requested: { label: '수정요청', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  accepted: { label: '수락', className: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: '거절', className: 'bg-red-50 text-red-600 border-red-200' },
  disputed: { label: '분쟁', className: 'bg-red-50 text-red-700 border-red-200' },
  investigating: { label: '조사중', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  resolved: { label: '해결', className: 'bg-green-50 text-green-700 border-green-200' },
  closed: { label: '종료', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
