import type {
  Workflow, WorkflowNode, ExecutionStep,
  WorkflowExecution, Operation, Notification, Product, ProductBatch,
} from '@/types';
import { getDaysUntilExpiry, generateId } from '@/lib/utils';
import { addDays } from 'date-fns';

export interface ProductContext {
  product: Product;
  batches: ProductBatch[];
}

export interface ExecutionResult {
  execution: WorkflowExecution;
  success: boolean;
  message: string;
}

type ExecutionCallbacks = {
  addOperation:    (op: Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>) => Operation;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void;
  addExecution:    (e: WorkflowExecution) => void;
};

type NodeStateCallback = (
  nodeId: string,
  state: 'idle' | 'running' | 'success' | 'failed' | 'skipped'
) => void;

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

function evaluateCondition(node: WorkflowNode, ctx: ProductContext): boolean {
  const config = node.data.config;
  const activeBatches = ctx.batches.filter(b => b.status === 'active');
  const totalQty = activeBatches.reduce((s, b) => s + b.quantity, 0);
  const earliestBatch = activeBatches.sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  )[0];
  const daysLeft = earliestBatch ? getDaysUntilExpiry(earliestBatch.expiryDate) : null;

  switch (node.data.nodeType) {
    case 'days-until-expiry': {
      if (daysLeft === null) return false;
      const op = String(config.operator); const val = Number(config.value);
      if (op === 'lte') return daysLeft <= val;
      if (op === 'lt')  return daysLeft < val;
      if (op === 'eq')  return daysLeft === val;
      if (op === 'gt')  return daysLeft > val;
      if (op === 'gte') return daysLeft >= val;
      return false;
    }
    case 'stock-quantity': {
      const op = String(config.operator); const val = Number(config.value);
      if (op === 'lt')  return totalQty < val;
      if (op === 'lte') return totalQty <= val;
      if (op === 'gt')  return totalQty > val;
      if (op === 'gte') return totalQty >= val;
      if (op === 'eq')  return totalQty === val;
      return false;
    }
    case 'product-category':
      return ctx.product.category === String(config.category);
    case 'inventory-value': {
      const value = activeBatches.reduce((s, b) => s + b.quantity * b.sellingPrice, 0);
      const op = String(config.operator); const val = Number(config.value);
      if (op === 'gt')  return value > val;
      if (op === 'gte') return value >= val;
      if (op === 'lt')  return value < val;
      return false;
    }
    case 'product-status':
      return activeBatches.some(b => b.status === String(config.status));
    default:
      return true;
  }
}

function executeAction(
  node: WorkflowNode,
  ctx: ProductContext,
  callbacks: ExecutionCallbacks,
): { message: string; operationId?: string } {
  const config = node.data.config;

  switch (node.data.nodeType) {
    case 'create-operation': {
      const op = callbacks.addOperation({
        title:       String(config.title || `Review ${ctx.product.name}`),
        description: `Automatically created by workflow for ${ctx.product.name}.`,
        type:        (config.operationType as Operation['type']) ?? 'manual',
        priority:    (config.priority as Operation['priority']) ?? 'medium',
        status:      'pending',
        productId:   ctx.product.id,
        batchId:     ctx.batches[0]?.id ?? null,
        assignedUserId: config.assignTo === 'manager' ? 'user-001' : 'user-002',
        dueDate:     addDays(new Date(), 1).toISOString(),
        sourceWorkflowId:   null,
        sourceWorkflowName: null,
        completedAt:  null,
        completedBy:  null,
        notes:        null,
      });
      return { message: `Operation "${op.title}" created and assigned.`, operationId: op.id };
    }

    case 'send-notification': {
      callbacks.addNotification({
        type:    'workflow-executed',
        title:   `Workflow notification: ${ctx.product.name}`,
        message: String(config.message || `Automated alert for ${ctx.product.name}.`),
        isRead:  false,
        relatedEntityId:   ctx.product.id,
        relatedEntityType: 'product',
      });
      return { message: `Notification sent to ${String(config.recipient || 'team')}.` };
    }

    case 'mark-expired':
      return { message: `${ctx.product.name} batch marked as expired.` };

    case 'suggest-discount':
      return { message: `${Math.round(Number(config.discountPercent ?? 25))}% discount suggested for ${ctx.product.name}.` };

    case 'create-purchase-request': {
      callbacks.addNotification({
        type:    'low-stock',
        title:   `Purchase request: ${ctx.product.name}`,
        message: `${String(config.urgency || 'Normal')} urgency purchase request created.`,
        isRead:  false,
        relatedEntityId:   ctx.product.id,
        relatedEntityType: 'product',
      });
      return { message: `Purchase request created for ${ctx.product.name}.` };
    }

    case 'add-activity-log':
      return { message: `Activity logged: ${String(config.message || 'Workflow executed.')}` };

    default:
      return { message: `Action "${node.data.label}" executed.` };
  }
}

export async function runWorkflowExecution(
  workflow: Workflow,
  ctx: ProductContext,
  callbacks: ExecutionCallbacks,
  onNodeState?: NodeStateCallback,
): Promise<ExecutionResult> {
  const startedAt = new Date().toISOString();
  const steps: ExecutionStep[] = [];
  const createdOpIds: string[] = [];

  const nodeMap  = new Map(workflow.nodes.map(n => [n.id, n]));
  const edgeMap  = new Map<string, string[]>();
  for (const e of workflow.edges) {
    if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
    edgeMap.get(e.source)!.push(e.target);
  }

  const triggerNode = workflow.nodes.find(n => n.data.category === 'trigger');
  if (!triggerNode) {
    return {
      execution: buildExecution(workflow, ctx, startedAt, 'failed', steps, createdOpIds),
      success: false,
      message: 'No trigger node found in workflow.',
    };
  }

  const visited = new Set<string>();
  const queue   = [triggerNode.id];
  let executionFailed = false;

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    onNodeState?.(nodeId, 'running');
    await sleep(420);

    let stepStatus: ExecutionStep['status'] = 'success';
    let stepMessage = '';

    if (node.data.category === 'trigger') {
      stepStatus  = 'success';
      stepMessage = `Trigger "${node.data.label}" matched for ${ctx.product.name}.`;
    } else if (node.data.category === 'condition') {
      const passed = evaluateCondition(node, ctx);
      stepStatus  = passed ? 'success' : 'skipped';
      stepMessage = passed
        ? `Condition "${node.data.label}" passed.`
        : `Condition "${node.data.label}" not met — downstream nodes skipped.`;
    } else if (node.data.category === 'action') {
      if (!executionFailed) {
        try {
          const result = executeAction(node, ctx, callbacks);
          if (result.operationId) createdOpIds.push(result.operationId);
          stepStatus  = 'success';
          stepMessage = result.message;
        } catch {
          stepStatus       = 'failed';
          stepMessage      = `Action "${node.data.label}" failed.`;
          executionFailed  = true;
        }
      } else {
        stepStatus  = 'skipped';
        stepMessage = 'Skipped due to earlier failure.';
      }
    }

    onNodeState?.(nodeId, stepStatus === 'skipped' ? 'skipped' : stepStatus === 'failed' ? 'failed' : 'success');

    steps.push({
      id:        generateId('step'),
      nodeId,
      nodeLabel: node.data.label,
      category:  node.data.category,
      status:    stepStatus,
      message:   stepMessage,
      timestamp: new Date().toISOString(),
    });

    // Don't traverse downstream if condition was not met
    if (stepStatus === 'skipped' && node.data.category === 'condition') continue;

    for (const nextId of edgeMap.get(nodeId) ?? []) {
      if (!visited.has(nextId)) queue.push(nextId);
    }
  }

  const completedAt = new Date().toISOString();
  const durationMs  = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const status: WorkflowExecution['status'] = executionFailed ? 'failed' : 'completed';

  const execution = buildExecution(workflow, ctx, startedAt, status, steps, createdOpIds, completedAt, durationMs);
  callbacks.addExecution(execution);

  return {
    execution,
    success: !executionFailed,
    message: executionFailed ? 'Workflow completed with errors.' : 'Workflow executed successfully.',
  };
}

function buildExecution(
  workflow: Workflow,
  ctx: ProductContext,
  startedAt: string,
  status: WorkflowExecution['status'],
  steps: ExecutionStep[],
  createdOpIds: string[],
  completedAt?: string,
  durationMs?: number,
): WorkflowExecution {
  const triggerNode = workflow.nodes.find(n => n.data.category === 'trigger');
  return {
    id:                  generateId('exec'),
    workflowId:          workflow.id,
    workflowName:        workflow.name,
    trigger:             triggerNode?.data.label ?? 'Manual',
    status,
    startedAt,
    completedAt:         completedAt ?? null,
    durationMs:          durationMs  ?? null,
    relatedProductId:    ctx.product.id,
    relatedProductName:  ctx.product.name,
    steps,
    createdOperationIds: createdOpIds,
  };
}
