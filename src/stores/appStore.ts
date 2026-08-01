import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductBatch, Operation, Notification, ActivityEvent, Workflow, WorkflowExecution } from '@/types';
import { initialBatches } from '@/data/batches';
import { initialOperations } from '@/data/operations';
import { initialNotifications } from '@/data/notifications';
import { initialActivities } from '@/data/activities';
import { initialWorkflows } from '@/data/workflows';
import { generateId } from '@/lib/utils';

interface AppState {
  currentStoreId: string;
  currentUserId: string;

  batches: ProductBatch[];
  operations: Operation[];
  notifications: Notification[];
  activities: ActivityEvent[];
  workflows: Workflow[];
  executions: WorkflowExecution[];

  // Actions — Batches
  addBatch: (batch: Omit<ProductBatch, 'id' | 'createdAt' | 'updatedAt'>) => ProductBatch;
  updateBatch: (id: string, updates: Partial<ProductBatch>) => void;

  // Actions — Operations
  addOperation: (op: Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>) => Operation;
  updateOperation: (id: string, updates: Partial<Operation>) => void;
  completeOperation: (id: string, completedBy: string, notes?: string) => void;
  dismissOperation: (id: string) => void;

  // Actions — Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void;

  // Actions — Activities
  addActivity: (a: Omit<ActivityEvent, 'id' | 'createdAt'>) => void;

  // Actions — Workflows
  addWorkflow: (w: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastExecutedAt'>) => Workflow;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  activateWorkflow: (id: string) => void;
  deactivateWorkflow: (id: string) => void;

  // Actions — Executions
  addExecution: (e: WorkflowExecution) => void;

  // UI
  setCurrentStore: (storeId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentStoreId: 'store-001',
      currentUserId: 'user-001',

      batches: initialBatches,
      operations: initialOperations,
      notifications: initialNotifications,
      activities: initialActivities,
      workflows: initialWorkflows,
      executions: [],

      addBatch: (batchData) => {
        const now = new Date().toISOString();
        const batch: ProductBatch = {
          ...batchData,
          id: generateId('batch'),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ batches: [...s.batches, batch] }));
        return batch;
      },

      updateBatch: (id, updates) => {
        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          ),
        }));
      },

      addOperation: (opData) => {
        const now = new Date().toISOString();
        const op: Operation = {
          ...opData,
          id: generateId('op'),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ operations: [op, ...s.operations] }));
        return op;
      },

      updateOperation: (id, updates) => {
        set((s) => ({
          operations: s.operations.map((o) =>
            o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
          ),
        }));
      },

      completeOperation: (id, completedBy, notes) => {
        const now = new Date().toISOString();
        set((s) => ({
          operations: s.operations.map((o) =>
            o.id === id
              ? { ...o, status: 'completed', completedAt: now, completedBy, notes: notes ?? o.notes, updatedAt: now }
              : o
          ),
        }));
        const op = get().operations.find((o) => o.id === id);
        if (op) {
          get().addActivity({
            type: 'operation-completed',
            title: `Operation completed: ${op.title}`,
            description: `${completedBy} completed the operation.`,
            actorId: get().currentUserId,
            actorName: completedBy,
            relatedEntityId: op.id,
            relatedEntityType: 'operation',
            relatedEntityName: op.title,
          });
        }
      },

      dismissOperation: (id) => {
        set((s) => ({
          operations: s.operations.map((o) =>
            o.id === id ? { ...o, status: 'dismissed', updatedAt: new Date().toISOString() } : o
          ),
        }));
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllNotificationsRead: () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      addNotification: (nData) => {
        const n: Notification = {
          ...nData,
          id: generateId('notif'),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [n, ...s.notifications] }));
      },

      addActivity: (aData) => {
        const a: ActivityEvent = {
          ...aData,
          id: generateId('act'),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ activities: [a, ...s.activities] }));
      },

      addWorkflow: (wData) => {
        const now = new Date().toISOString();
        const wf: Workflow = {
          ...wData,
          id: generateId('wf'),
          executionCount: 0,
          lastExecutedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ workflows: [...s.workflows, wf] }));
        return wf;
      },

      updateWorkflow: (id, updates) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
          ),
        }));
      },

      deleteWorkflow: (id) => {
        set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) }));
      },

      activateWorkflow: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id ? { ...w, status: 'active', updatedAt: now } : w
          ),
        }));
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) {
          get().addActivity({
            type: 'workflow-activated',
            title: `Workflow activated: ${wf.name}`,
            description: `Workflow "${wf.name}" is now active and monitoring for triggers.`,
            actorId: get().currentUserId,
            actorName: 'Sarah Mitchell',
            relatedEntityId: id,
            relatedEntityType: 'workflow',
            relatedEntityName: wf.name,
          });
        }
      },

      deactivateWorkflow: (id) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id ? { ...w, status: 'inactive', updatedAt: new Date().toISOString() } : w
          ),
        }));
      },

      addExecution: (e) => {
        set((s) => ({ executions: [e, ...s.executions] }));
        // Update workflow execution count
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === e.workflowId
              ? { ...w, executionCount: w.executionCount + 1, lastExecutedAt: e.startedAt }
              : w
          ),
        }));
        // Add activity — keep description in English (gets localized at render time)
        const opsCount = e.createdOperationIds.length;
        get().addActivity({
          type: 'workflow-executed',
          title: `${e.workflowName} workflow completed`,
          description: `Workflow executed. ${opsCount} operation(s) created.`,
          actorId: 'system',
          actorName: 'System',
          relatedEntityId: e.workflowId,
          relatedEntityType: 'workflow',
          relatedEntityName: e.workflowName,
        });
      },

      setCurrentStore: (storeId) => set({ currentStoreId: storeId }),
    }),
    {
      name: 'freshflow-store',
      partialize: (state) => ({
        batches: state.batches,
        operations: state.operations,
        notifications: state.notifications,
        activities: state.activities,
        workflows: state.workflows,
        executions: state.executions,
        currentStoreId: state.currentStoreId,
      }),
    }
  )
);
