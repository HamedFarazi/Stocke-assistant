import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';

export function useOperations() {
  const { operations } = useAppStore();

  const metrics = useMemo(() => {
    const open = operations.filter(o => o.status === 'pending' || o.status === 'in-progress');
    const pending = operations.filter(o => o.status === 'pending');
    const inProgress = operations.filter(o => o.status === 'in-progress');
    const completed = operations.filter(o => o.status === 'completed');
    const critical = open.filter(o => o.priority === 'critical');

    // Overdue: pending with past due date
    const now = new Date();
    const overdue = open.filter(o => new Date(o.dueDate) < now);

    return {
      openCount: open.length,
      pendingCount: pending.length,
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      criticalCount: critical.length,
      overdueCount: overdue.length,
    };
  }, [operations]);

  return { operations, metrics };
}
