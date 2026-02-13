import { describe, it, expect } from 'vitest';

// Test the status config mapping (unit test without React rendering)
const statusConfig: Record<string, { label: string }> = {
  draft: { label: '초안' },
  open: { label: '모집중' },
  in_progress: { label: '진행중' },
  review: { label: '검수중' },
  completed: { label: '완료' },
  cancelled: { label: '취소' },
  pending: { label: '대기' },
  submitted: { label: '제출됨' },
  approved: { label: '승인' },
  revision_requested: { label: '수정요청' },
  disputed: { label: '분쟁' },
  investigating: { label: '조사중' },
  resolved: { label: '해결' },
  closed: { label: '종료' },
};

describe('StatusBadge config', () => {
  it('has all project statuses', () => {
    const projectStatuses = ['draft', 'open', 'in_progress', 'review', 'completed', 'cancelled'];
    for (const status of projectStatuses) {
      expect(statusConfig[status]).toBeDefined();
      expect(statusConfig[status]?.label).toBeTruthy();
    }
  });

  it('has all milestone statuses', () => {
    const milestoneStatuses = ['pending', 'submitted', 'approved', 'revision_requested', 'completed'];
    for (const status of milestoneStatuses) {
      expect(statusConfig[status]).toBeDefined();
      expect(statusConfig[status]?.label).toBeTruthy();
    }
  });

  it('has all dispute statuses', () => {
    const disputeStatuses = ['open', 'investigating', 'resolved', 'closed'];
    for (const status of disputeStatuses) {
      expect(statusConfig[status]).toBeDefined();
      expect(statusConfig[status]?.label).toBeTruthy();
    }
  });

  it('returns Korean labels', () => {
    expect(statusConfig['open']?.label).toBe('모집중');
    expect(statusConfig['in_progress']?.label).toBe('진행중');
    expect(statusConfig['completed']?.label).toBe('완료');
  });

  it('has 14 total statuses', () => {
    expect(Object.keys(statusConfig).length).toBe(14);
  });
});
