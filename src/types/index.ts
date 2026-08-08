// ============================================================
// CORE DOMAIN TYPES — FreshFlow
// ============================================================

export type ID = string;

// ---- Store ----
export interface Store {
  id: ID;
  name: string;
  nameFa?: string;
  address: string;
  addressFa?: string;
  postcode: string;
  postcodeFa?: string;
  manager: string;
  managerFa?: string;
  phone: string;
  phoneFa?: string;
  createdAt: string;
}

export interface User {
  id: ID;
  name: string;
  nameFa?: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  roleFa?: string;
  storeId: ID;
  avatarUrl?: string;
}

// ---- Supplier ----
export interface Supplier {
  id: ID;
  name: string;
  nameFa?: string;
  contactEmail: string;
  contactPhone: string;
  category: ProductCategory;
}

// ---- Product ----
export type ProductCategory =
  | 'Dairy'
  | 'Meat & Poultry'
  | 'Bakery'
  | 'Produce'
  | 'Seafood'
  | 'Deli'
  | 'Frozen'
  | 'Beverages'
  | 'Snacks'
  | 'Condiments'
  | 'Canned Goods'
  | 'Health & Beauty';

export interface Product {
  id: ID;
  name: string;
  nameFa?: string;
  sku: string;
  category: ProductCategory;
  supplierId: ID;
  imageUrl?: string;
  unit: string;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  storageLocation: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Product Batch ----
export type BatchStatus = 'active' | 'expired' | 'removed' | 'discounted';
export type RiskLevel = 'normal' | 'attention' | 'urgent' | 'critical';

export interface ProductBatch {
  id: ID;
  productId: ID;
  batchCode: string;
  quantity: number;
  initialQuantity: number;
  expiryDate: string; // ISO date string
  purchaseCost: number;
  sellingPrice: number;
  supplierId: ID;
  storageLocation: string;
  status: BatchStatus;
  receivedDate: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Inventory Item (product + batches aggregated view) ----
export interface InventoryItem {
  product: Product;
  batches: ProductBatch[];
  totalQuantity: number;
  earliestExpiry: string | null;
  daysUntilExpiry: number | null;
  riskLevel: RiskLevel;
  totalValue: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
}

// ---- Operation ----
export type OperationStatus = 'pending' | 'in-progress' | 'completed' | 'dismissed';
export type OperationPriority = 'low' | 'medium' | 'high' | 'critical';
export type OperationType =
  | 'remove-expired'
  | 'discount-review'
  | 'priority-shelf'
  | 'restock'
  | 'supplier-review'
  | 'batch-inspect'
  | 'manual';

export interface Operation {
  id: ID;
  title: string;
  titleFa?: string;
  description: string;
  descriptionFa?: string;
  type: OperationType;
  priority: OperationPriority;
  status: OperationStatus;
  productId: ID | null;
  batchId: ID | null;
  assignedUserId: ID | null;
  dueDate: string;
  sourceWorkflowId: ID | null;
  sourceWorkflowName: string | null;
  sourceWorkflowNameFa?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
}

// ---- User ----
export type UserRole = 'manager' | 'staff' | 'admin';

export interface User {
  id: ID;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  storeId: ID;
}

// ---- Workflow ----
export type WorkflowStatus = 'active' | 'inactive' | 'draft';

export interface Workflow {
  id: ID;
  name: string;
  nameFa?: string;
  description: string;
  descriptionFa?: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: ID;
}

// ---- Workflow Node ----
export type NodeCategory = 'trigger' | 'condition' | 'action';

export type TriggerType =
  | 'product-sold'
  | 'new-product-added'
  | 'inventory-updated'
  | 'expiry-approaching'
  | 'product-expired'
  | 'low-stock-detected'
  | 'scheduled-time'
  | 'manual-trigger';

export type ConditionType =
  | 'days-until-expiry'
  | 'stock-quantity'
  | 'product-category'
  | 'inventory-value'
  | 'product-status'
  | 'supplier'
  | 'location';

export type ActionType =
  | 'create-operation'
  | 'send-notification'
  | 'mark-expired'
  | 'suggest-discount'
  | 'create-purchase-request'
  | 'assign-operation'
  | 'update-product-status'
  | 'add-activity-log';

export type NodeType = TriggerType | ConditionType | ActionType;

export interface WorkflowNode {
  id: ID;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  nodeType: NodeType;
  category: NodeCategory;
  label: string;
  description: string;
  config: Record<string, unknown>;
  executionState?: 'idle' | 'running' | 'success' | 'failed' | 'skipped';
}

export interface WorkflowEdge {
  id: ID;
  source: string;
  target: string;
  type?: string;
  label?: string;
}

// ---- Workflow Execution ----
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'partial';

export interface WorkflowExecution {
  id: ID;
  workflowId: ID;
  workflowName: string;
  trigger: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  relatedProductId: ID | null;
  relatedProductName: string | null;
  steps: ExecutionStep[];
  createdOperationIds: ID[];
}

export interface ExecutionStep {
  id: ID;
  nodeId: string;
  nodeLabel: string;
  category: NodeCategory;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  timestamp: string;
}

// ---- Notification ----
export type NotificationType =
  | 'critical-expiry'
  | 'low-stock'
  | 'workflow-failure'
  | 'operation-assigned'
  | 'operation-overdue'
  | 'workflow-executed'
  | 'product-expired';

export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  titleFa?: string;
  message: string;
  messageFa?: string;
  isRead: boolean;
  relatedEntityId: ID | null;
  relatedEntityType: 'product' | 'operation' | 'workflow' | 'batch' | null;
  createdAt: string;
}

// ---- Activity Event ----
export type ActivityEventType =
  | 'product-added'
  | 'batch-added'
  | 'product-expired'
  | 'operation-created'
  | 'operation-completed'
  | 'operation-dismissed'
  | 'workflow-activated'
  | 'workflow-executed'
  | 'product-marked-removed'
  | 'product-discounted'
  | 'batch-discounted'
  | 'stock-updated'
  | 'purchase-request-created';

export interface ActivityEvent {
  id: ID;
  type: ActivityEventType;
  title: string;
  titleFa?: string;
  description: string;
  descriptionFa?: string;
  actorId: ID;
  actorName: string;
  relatedEntityId: ID | null;
  relatedEntityType: 'product' | 'operation' | 'workflow' | 'batch' | null;
  relatedEntityName: string | null;
  createdAt: string;
}

// ---- Analytics ----
export interface AnalyticsDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface CategoryRisk {
  category: string;
  value: number;
  count: number;
}

export interface WorkflowStats {
  workflowId: ID;
  workflowName: string;
  executions: number;
  successRate: number;
  operationsCreated: number;
}

// ---- Attention Item ----
export interface AttentionItem {
  id: ID;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'expired' | 'expiring-soon' | 'high-stock-expiry' | 'low-stock' | 'unresolved-operation';
  productId: ID;
  productName: string;
  batchId: ID | null;
  quantity: number;
  expiryDate: string | null;
  daysRemaining: number | null;
  estimatedValueAtRisk: number;
  recommendedAction: string;
  actionLabel: string;
}

// ---- Purchase Request ----
export type PurchaseRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'ordered' | 'delivered';

export interface PurchaseRequest {
  id: ID;
  productId: ID;
  productName: string;
  supplierId: ID;
  supplierName: string;
  quantity: number;
  reason: string;
  priority: OperationPriority;
  expectedDelivery: string;
  requester: string;
  assignee: string | null;
  status: PurchaseRequestStatus;
  createdAt: string;
  updatedAt: string;
}

