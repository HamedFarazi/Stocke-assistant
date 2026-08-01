import type { NodeCategory, NodeType } from '@/types';

export interface NodeDef {
  type: NodeType;
  category: NodeCategory;
  label: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  configFields?: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export const triggerNodes: NodeDef[] = [
  {
    type: 'product-sold',
    category: 'trigger',
    label: 'Product Sold',
    description: 'Fires when a product unit is sold at checkout',
    defaultConfig: {},
  },
  {
    type: 'new-product-added',
    category: 'trigger',
    label: 'New Product Added',
    description: 'Fires when a new product or batch is added to inventory',
    defaultConfig: {},
  },
  {
    type: 'inventory-updated',
    category: 'trigger',
    label: 'Inventory Updated',
    description: 'Fires when inventory quantity changes',
    defaultConfig: {},
  },
  {
    type: 'expiry-approaching',
    category: 'trigger',
    label: 'Expiry Approaching',
    description: 'Fires when a batch approaches its expiry date',
    defaultConfig: { daysThreshold: 7 },
    configFields: [
      { key: 'daysThreshold', label: 'Days Before Expiry', type: 'number', placeholder: '7' },
    ],
  },
  {
    type: 'product-expired',
    category: 'trigger',
    label: 'Product Expired',
    description: 'Fires when a batch passes its expiry date',
    defaultConfig: {},
  },
  {
    type: 'low-stock-detected',
    category: 'trigger',
    label: 'Low Stock Detected',
    description: 'Fires when stock falls below the minimum level',
    defaultConfig: { threshold: 5 },
    configFields: [
      { key: 'threshold', label: 'Stock Threshold', type: 'number', placeholder: '5' },
    ],
  },
  {
    type: 'scheduled-time',
    category: 'trigger',
    label: 'Scheduled Time',
    description: 'Fires at a specific time each day or week',
    defaultConfig: { time: '08:00', frequency: 'daily' },
    configFields: [
      { key: 'time', label: 'Time', type: 'text', placeholder: '08:00' },
      { key: 'frequency', label: 'Frequency', type: 'select', options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
      ]},
    ],
  },
  {
    type: 'manual-trigger',
    category: 'trigger',
    label: 'Manual Trigger',
    description: 'Run this workflow manually on demand',
    defaultConfig: {},
  },
];

export const conditionNodes: NodeDef[] = [
  {
    type: 'days-until-expiry',
    category: 'condition',
    label: 'Days Until Expiry',
    description: 'Check the number of days before a batch expires',
    defaultConfig: { operator: 'lte', value: 7 },
    configFields: [
      { key: 'operator', label: 'Operator', type: 'select', options: [
        { label: 'Less than or equal to (≤)', value: 'lte' },
        { label: 'Less than (<)', value: 'lt' },
        { label: 'Equal to (=)', value: 'eq' },
        { label: 'Greater than (>)', value: 'gt' },
      ]},
      { key: 'value', label: 'Days', type: 'number', placeholder: '7' },
    ],
  },
  {
    type: 'stock-quantity',
    category: 'condition',
    label: 'Stock Quantity',
    description: 'Check if current stock meets a quantity condition',
    defaultConfig: { operator: 'lt', value: 5 },
    configFields: [
      { key: 'operator', label: 'Operator', type: 'select', options: [
        { label: 'Less than (<)', value: 'lt' },
        { label: 'Less than or equal to (≤)', value: 'lte' },
        { label: 'Greater than (>)', value: 'gt' },
        { label: 'Greater than or equal to (≥)', value: 'gte' },
        { label: 'Equal to (=)', value: 'eq' },
      ]},
      { key: 'value', label: 'Quantity', type: 'number', placeholder: '5' },
    ],
  },
  {
    type: 'product-category',
    category: 'condition',
    label: 'Product Category',
    description: 'Check if product belongs to a specific category',
    defaultConfig: { category: 'Dairy' },
    configFields: [
      { key: 'category', label: 'Category', type: 'select', options: [
        'Dairy', 'Meat & Poultry', 'Bakery', 'Produce', 'Seafood', 'Deli', 'Frozen', 'Beverages'
      ].map(c => ({ label: c, value: c }))},
    ],
  },
  {
    type: 'inventory-value',
    category: 'condition',
    label: 'Inventory Value',
    description: 'Check if the value of inventory at risk exceeds a threshold',
    defaultConfig: { operator: 'gte', value: 50 },
    configFields: [
      { key: 'operator', label: 'Operator', type: 'select', options: [
        { label: 'Greater than (>)', value: 'gt' },
        { label: 'Greater than or equal to (≥)', value: 'gte' },
        { label: 'Less than (<)', value: 'lt' },
      ]},
      { key: 'value', label: 'Value (£)', type: 'number', placeholder: '50' },
    ],
  },
  {
    type: 'product-status',
    category: 'condition',
    label: 'Product Status',
    description: 'Check the current status of a product or batch',
    defaultConfig: { status: 'active' },
    configFields: [
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Discounted', value: 'discounted' },
      ]},
    ],
  },
  {
    type: 'supplier',
    category: 'condition',
    label: 'Supplier',
    description: 'Check if a product comes from a specific supplier',
    defaultConfig: { supplierId: '' },
  },
  {
    type: 'location',
    category: 'condition',
    label: 'Storage Location',
    description: 'Check if a product is stored in a specific location',
    defaultConfig: { location: '' },
    configFields: [
      { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Chiller A1' },
    ],
  },
];

export const actionNodes: NodeDef[] = [
  {
    type: 'create-operation',
    category: 'action',
    label: 'Create Operation',
    description: 'Create a new operational task for store staff',
    defaultConfig: { operationType: 'discount-review', priority: 'high', title: '', assignTo: 'staff' },
    configFields: [
      { key: 'title', label: 'Operation Title', type: 'text', placeholder: 'e.g. Review expiring product' },
      { key: 'operationType', label: 'Type', type: 'select', options: [
        { label: 'Remove Expired', value: 'remove-expired' },
        { label: 'Discount Review', value: 'discount-review' },
        { label: 'Priority Shelf', value: 'priority-shelf' },
        { label: 'Restock', value: 'restock' },
        { label: 'Batch Inspect', value: 'batch-inspect' },
      ]},
      { key: 'priority', label: 'Priority', type: 'select', options: [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ]},
      { key: 'assignTo', label: 'Assign To', type: 'select', options: [
        { label: 'Manager', value: 'manager' },
        { label: 'Staff', value: 'staff' },
        { label: 'Unassigned', value: 'unassigned' },
      ]},
    ],
  },
  {
    type: 'send-notification',
    category: 'action',
    label: 'Send Notification',
    description: 'Send an in-app notification to store staff or manager',
    defaultConfig: { recipient: 'manager', message: '' },
    configFields: [
      { key: 'recipient', label: 'Recipient', type: 'select', options: [
        { label: 'Manager', value: 'manager' },
        { label: 'All Staff', value: 'staff' },
        { label: 'Everyone', value: 'all' },
      ]},
      { key: 'message', label: 'Message', type: 'text', placeholder: 'Notification message…' },
    ],
  },
  {
    type: 'mark-expired',
    category: 'action',
    label: 'Mark as Expired',
    description: 'Update the batch status to expired in the system',
    defaultConfig: {},
  },
  {
    type: 'suggest-discount',
    category: 'action',
    label: 'Suggest Discount',
    description: 'Flag the product for a price discount review',
    defaultConfig: { discountPercent: 25 },
    configFields: [
      { key: 'discountPercent', label: 'Suggested Discount (%)', type: 'number', placeholder: '25' },
    ],
  },
  {
    type: 'create-purchase-request',
    category: 'action',
    label: 'Create Purchase Request',
    description: 'Generate a purchase request for a low-stock product',
    defaultConfig: { urgency: 'normal' },
    configFields: [
      { key: 'urgency', label: 'Urgency', type: 'select', options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Urgent', value: 'urgent' },
      ]},
    ],
  },
  {
    type: 'assign-operation',
    category: 'action',
    label: 'Assign Operation',
    description: 'Assign an existing operation to a team member',
    defaultConfig: { assignTo: 'staff' },
  },
  {
    type: 'update-product-status',
    category: 'action',
    label: 'Update Product Status',
    description: 'Change the status of a product or batch',
    defaultConfig: { status: 'discounted' },
    configFields: [
      { key: 'status', label: 'New Status', type: 'select', options: [
        { label: 'Discounted', value: 'discounted' },
        { label: 'Expired', value: 'expired' },
        { label: 'Removed', value: 'removed' },
      ]},
    ],
  },
  {
    type: 'add-activity-log',
    category: 'action',
    label: 'Add Activity Log',
    description: 'Record an event in the activity timeline',
    defaultConfig: { message: '' },
    configFields: [
      { key: 'message', label: 'Log Message', type: 'text', placeholder: 'Activity description…' },
    ],
  },
];

export const allNodeDefs = [...triggerNodes, ...conditionNodes, ...actionNodes];

export function getNodeDef(type: string): NodeDef | undefined {
  return allNodeDefs.find(d => d.type === type);
}
