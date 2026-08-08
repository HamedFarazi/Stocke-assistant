import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { products } from '@/data/products';
import { users } from '@/data/users';
import { useOperations } from '@/hooks/useOperations';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocale } from '@/hooks/useLocale';
import { exportCSV, printAsPDF } from '@/lib/exportUtils';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { cn, getPriorityColor, getStatusColor } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Input';
import {
  Plus, ClipboardList, LayoutGrid, List, Search,
  CheckCircle2, Clock, ChevronRight, AlertCircle, Zap, User,
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import type { Operation, OperationStatus } from '@/types';
import { CreateOperationDialog } from './CreateOperationDialog';
import { OperationDetailDrawer } from './OperationDetailDrawer';

const statusColumns: OperationStatus[] = ['pending', 'in-progress', 'completed', 'dismissed'];

export function OperationsPage() {
  const { metrics } = useOperations();
  const { operations } = useAppStore();
  const { t, isRTL } = useTranslation();
  const { formatDate, formatNumber } = useLocale();
  const op = t.operations;

  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const statusLabels: Record<OperationStatus, string> = {
    'pending':     op.pending,
    'in-progress': op.inProgressStatus,
    'completed':   op.completed,
    'dismissed':   op.dismissed,
  };
  const statusColors: Record<OperationStatus, string> = {
    'pending':     'bg-slate-100 text-slate-600',
    'in-progress': 'bg-blue-100 text-blue-700',
    'completed':   'bg-green-100 text-green-700',
    'dismissed':   'bg-slate-50 text-slate-400',
  };

  const filtered = useMemo(() => {
    let ops = [...operations];
    if (search) {
      const q = search.toLowerCase();
      ops = ops.filter(o => o.title.toLowerCase().includes(q) || o.description.toLowerCase().includes(q) || (o.titleFa && o.titleFa.toLowerCase().includes(q)));
    }
    if (statusFilter)   ops = ops.filter(o => o.status === statusFilter);
    if (priorityFilter) ops = ops.filter(o => o.priority === priorityFilter);
    return ops.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [operations, search, statusFilter, priorityFilter]);

  const hasFilters = !!(search || statusFilter || priorityFilter);

  const summaryBadges = [
    { label: `${formatNumber(metrics.pendingCount)} ${op.pending}`,         color: 'bg-slate-100 text-slate-700',  filter: 'pending' },
    { label: `${formatNumber(metrics.inProgressCount)} ${op.inProgressStatus}`, color: 'bg-blue-50 text-blue-700',   filter: 'in-progress' },
    { label: `${formatNumber(metrics.completedCount)} ${op.completed}`,     color: 'bg-green-50 text-green-700',  filter: 'completed' },
    ...(metrics.criticalCount > 0
      ? [{ label: `${formatNumber(metrics.criticalCount)} ${op.critical}`,  color: 'bg-red-50 text-red-700',      filter: '' }]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn(isRTL && 'text-right')}>
          <h1 className="text-xl font-semibold text-slate-900">{op.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {formatNumber(metrics.openCount)} {op.open} · {formatNumber(metrics.inProgressCount)} {op.inProgress}
            {metrics.overdueCount > 0 && (
              <span className="text-red-600 mx-1">· {formatNumber(metrics.overdueCount)} {op.overdueLabel}</span>
            )}
          </p>
        </div>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <div className="flex border border-slate-200 rounded-md overflow-hidden">
            <button onClick={() => setView('list')} title="List"
              className={cn('px-2.5 py-1.5', view === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50')}>
              <List size={14} />
            </button>
            <button onClick={() => setView('kanban')} title="Kanban"
              className={cn('px-2.5 py-1.5 border-l border-slate-200', view === 'kanban' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50')}>
              <LayoutGrid size={14} />
            </button>
          </div>
          <ExportMenu
            onExportCSV={() => exportCSV(
              filtered.map(o => ({
                [op.operationTitle]: isRTL && o.titleFa ? o.titleFa : o.title,
                [op.operationType]: o.type,
                [t.common.priority]: o.priority,
                [t.common.status]: o.status,
                [op.dueDate]: new Date(o.dueDate).toLocaleDateString(),
                [op.sourceWorkflow]: o.sourceWorkflowName ?? '',
              })),
              'freshflow-operations'
            )}
            onPrint={() => printAsPDF(
              isRTL ? 'گزارش عملیات‌ها' : 'Operations Report',
              `<h1>${isRTL ? 'عملیات‌ها' : 'Operations'}</h1><table>
               <tr><th>${op.operationTitle}</th><th>${t.common.priority}</th><th>${t.common.status}</th><th>${op.dueDate}</th></tr>
               ${filtered.map(o=>`<tr><td>${isRTL && o.titleFa ? o.titleFa : o.title}</td><td>${o.priority}</td><td>${o.status}</td><td>${new Date(o.dueDate).toLocaleDateString()}</td></tr>`).join('')}
               </table>`,
              isRTL
            )}
          />
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
            {op.newOperation}
          </Button>
        </div>
      </div>

      {/* Summary badges */}
      <div className={cn('flex flex-wrap gap-2', isRTL && 'flex-row-reverse')}>
        {summaryBadges.map(s => (
          <button key={s.label} onClick={() => setStatusFilter(s.filter)}
            className={cn('inline-flex items-center text-xs font-medium rounded-full px-3 py-1 transition-colors hover:opacity-80', s.color)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={cn('flex flex-wrap gap-2 items-center', isRTL && 'flex-row-reverse')}>
        <Input placeholder={op.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
          leftIcon={<Search size={13} />} className="w-52" dir={isRTL ? 'rtl' : 'ltr'} />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36 text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
          <option value="">{op.allStatuses}</option>
          <option value="pending">{op.pending}</option>
          <option value="in-progress">{op.inProgressStatus}</option>
          <option value="completed">{op.completed}</option>
          <option value="dismissed">{op.dismissed}</option>
        </Select>
        <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-32 text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
          <option value="">{op.allPriorities}</option>
          <option value="critical">{op.critical}</option>
          <option value="high">{op.high}</option>
          <option value="medium">{op.medium}</option>
          <option value="low">{op.low}</option>
        </Select>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }}>
            {t.common.clear}
          </Button>
        )}
        <span className={cn('text-xs text-slate-400', !isRTL && 'ml-auto', isRTL && 'mr-auto')}>
          {formatNumber(filtered.length)} {t.common.results}
        </span>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3', isRTL && 'direction-rtl')}>
          {statusColumns.map(status => {
            const col = filtered.filter(o => o.status === status);
            return (
              <div key={status} className="bg-slate-50 rounded-lg border border-slate-200 p-3 min-h-[300px]">
                <div className={cn('flex items-center justify-between mb-3', isRTL && 'flex-row-reverse')}>
                  <span className={cn('text-xs font-semibold rounded-full px-2 py-0.5', statusColors[status])}>
                    {statusLabels[status]}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{formatNumber(col.length)}</span>
                </div>
                <div className="space-y-2">
                  {col.map(o => (
                    <KanbanCard key={o.id} op={o} onClick={() => setSelectedOp(o)}
                      priorityLabel={op[o.priority as keyof typeof op] as string ?? o.priority}
                      formatDate={formatDate} isRTL={isRTL} />
                  ))}
                  {col.length === 0 && <p className="text-xs text-slate-400 text-center py-6">{op.noOperations}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <Card padding="none">
          {filtered.length === 0 ? (
            <EmptyState icon={<ClipboardList size={24} />} title={op.noOperations} description={op.noOperationsDesc}
              action={<Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus size={13} />}>{op.createOperation}</Button>} />
          ) : (
            <div>
              {filtered.map((o, idx) => {
                const product = products.find(p => p.id === o.productId);
                const assignedUser = users.find(u => u.id === o.assignedUserId);
                const isOverdue = (o.status === 'pending' || o.status === 'in-progress') && isPast(new Date(o.dueDate));
                const displayTitle = isRTL && o.titleFa ? o.titleFa : o.title;
                const displayDesc = isRTL && o.descriptionFa ? o.descriptionFa : o.description;
                const displayProductName = product ? (isRTL && product.nameFa ? product.nameFa : product.name) : null;
                const displayWorkflowName = isRTL && o.sourceWorkflowNameFa ? o.sourceWorkflowNameFa : o.sourceWorkflowName;
                const displayAssignee = assignedUser ? (isRTL && assignedUser.nameFa ? assignedUser.nameFa : assignedUser.name) : (isRTL ? 'تعیین نشده' : 'Unassigned');

                return (
                  <div key={o.id}
                    className={cn('flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors group',
                      idx !== 0 && 'border-t border-slate-50', isOverdue && 'bg-red-50/30', isRTL && 'flex-row-reverse')}
                    onClick={() => setSelectedOp(o)}>
                    <div className={cn('w-1 self-stretch rounded-full flex-shrink-0',
                      o.priority === 'critical' ? 'bg-red-500' : o.priority === 'high' ? 'bg-orange-400' : o.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-200')} />
                    <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                      <div className={cn('flex items-center gap-2 flex-wrap', isRTL && 'flex-row-reverse')}>
                        <span className="text-sm font-medium text-slate-900 group-hover:text-green-800 transition-colors">{displayTitle}</span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-700 bg-red-100 rounded-full px-1.5 py-0.5">
                            <AlertCircle size={9} /> {t.common.overdue}
                          </span>
                        )}
                        <span className={cn('text-[11px] font-medium rounded-full px-2 py-0.5', getPriorityColor(o.priority))}>
                          {op[o.priority as keyof typeof op] as string ?? o.priority}
                        </span>
                        <span className={cn('text-[11px] font-medium rounded-full px-2 py-0.5', getStatusColor(o.status))}>
                          {statusLabels[o.status]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{displayDesc}</p>
                      <div className={cn('flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap', isRTL && 'flex-row-reverse')}>
                        {displayProductName && <span className="font-medium text-slate-600">{displayProductName}</span>}
                        
                        {/* Assigned Person Badge */}
                        <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full', isRTL && 'flex-row-reverse')}>
                          <User size={10} className="text-slate-500" />
                          <span>{isRTL ? 'مسئول:' : 'Assigned:'} {displayAssignee}</span>
                        </span>

                        {displayWorkflowName && (
                          <span className={cn('flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
                            <Zap size={9} />{displayWorkflowName}
                          </span>
                        )}
                        <span className={cn('flex items-center gap-0.5', isOverdue && 'text-red-500 font-medium', isRTL && 'flex-row-reverse')}>
                          <Clock size={9} /> {op.dueLabel} {formatDate(o.dueDate)}
                        </span>
                        <span>{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {o.status === 'completed' && <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-1" />}
                    <ChevronRight size={13} className={cn('text-slate-300 flex-shrink-0 mt-1', isRTL && 'rotate-180')} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <CreateOperationDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {selectedOp && (
        <OperationDetailDrawer operation={selectedOp} open={!!selectedOp} onClose={() => setSelectedOp(null)} />
      )}
    </div>
  );
}

function KanbanCard({ op, onClick, priorityLabel, formatDate, isRTL }: {
  op: Operation; onClick: () => void; priorityLabel: string;
  formatDate: (d: string) => string; isRTL: boolean;
}) {
  const product = products.find(p => p.id === op.productId);
  const assignedUser = users.find(u => u.id === op.assignedUserId);
  const isOverdue = (op.status === 'pending' || op.status === 'in-progress') && isPast(new Date(op.dueDate));
  const displayTitle = isRTL && op.titleFa ? op.titleFa : op.title;
  const displayProductName = product ? (isRTL && product.nameFa ? product.nameFa : product.name) : null;
  const displayAssignee = assignedUser ? (isRTL && assignedUser.nameFa ? assignedUser.nameFa : assignedUser.name) : (isRTL ? 'تعیین نشده' : 'Unassigned');

  return (
    <button onClick={onClick}
      className={cn('w-full text-left bg-white border rounded-md p-3 hover:border-slate-300 transition-all shadow-sm hover:shadow',
        isOverdue ? 'border-red-200 bg-red-50/50' : 'border-slate-200', isRTL && 'text-right')}>
      <p className="text-xs font-medium text-slate-900 line-clamp-2 leading-snug">{displayTitle}</p>
      {displayProductName && <p className="text-[11px] text-slate-500 font-medium mt-1">{displayProductName}</p>}
      <div className={cn('flex items-center gap-1 text-[10px] text-slate-500 mt-1', isRTL && 'flex-row-reverse')}>
        <User size={10} className="text-slate-400" />
        <span>{displayAssignee}</span>
      </div>
      <div className={cn('flex items-center justify-between mt-2', isRTL && 'flex-row-reverse')}>
        <span className={cn('inline-flex text-[10px] font-semibold rounded-full px-1.5 py-0.5', getPriorityColor(op.priority))}>
          {priorityLabel}
        </span>
        <span className={cn('text-[10px]', isOverdue ? 'text-red-500 font-medium' : 'text-slate-400')}>
          {formatDate(op.dueDate)}
        </span>
      </div>
    </button>
  );
}

