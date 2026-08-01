import type { ProductBatch, Operation, Notification, ActivityEvent, Workflow } from '@/types';
import { addDays, subDays, subHours, subMinutes, format } from 'date-fns';

const today = new Date();
const fmt = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss'Z'");

// ── Demo store info ───────────────────────────────────────────────────────────
export const DEMO_STORE = {
  id: 'demo-store',
  name: 'London Fresh Market',
  address: '14 Borough Market Lane',
  postcode: 'SE1 1TL',
  manager: 'Emma Wilson',
  phone: '020 7403 8765',
  createdAt: '2024-01-01T00:00:00Z',
};

export const DEMO_USER = {
  id: 'demo-user-001',
  name: 'Emma Wilson',
  email: 'emma.wilson@londonfresh.co.uk',
  role: 'manager' as const,
  storeId: 'demo-store',
};

// ── Demo batches (rich, realistic) ───────────────────────────────────────────
export const demoBatches: ProductBatch[] = [
  // Whole Milk — 2 batches, one expiring soon
  { id:'db-001', productId:'prod-001', batchCode:'WM-D001', quantity:18, initialQuantity:24, expiryDate:fmt(addDays(today,2)), purchaseCost:0.95, sellingPrice:1.55, supplierId:'sup-001', storageLocation:'Chiller A1', status:'active', receivedDate:fmt(subDays(today,5)), createdAt:fmt(subDays(today,5)), updatedAt:fmt(subDays(today,5)) },
  { id:'db-002', productId:'prod-001', batchCode:'WM-D002', quantity:36, initialQuantity:36, expiryDate:fmt(addDays(today,9)), purchaseCost:0.95, sellingPrice:1.55, supplierId:'sup-001', storageLocation:'Chiller A1', status:'active', receivedDate:fmt(subDays(today,2)), createdAt:fmt(subDays(today,2)), updatedAt:fmt(subDays(today,2)) },
  // Greek Yogurt — expiring in 3 days (high risk)
  { id:'db-003', productId:'prod-002', batchCode:'GY-D101', quantity:24, initialQuantity:30, expiryDate:fmt(addDays(today,3)), purchaseCost:1.10, sellingPrice:1.99, supplierId:'sup-001', storageLocation:'Chiller A2', status:'active', receivedDate:fmt(subDays(today,7)), createdAt:fmt(subDays(today,7)), updatedAt:fmt(subDays(today,7)) },
  { id:'db-004', productId:'prod-002', batchCode:'GY-D102', quantity:20, initialQuantity:20, expiryDate:fmt(addDays(today,14)), purchaseCost:1.10, sellingPrice:1.99, supplierId:'sup-001', storageLocation:'Chiller A2', status:'active', receivedDate:fmt(subDays(today,1)), createdAt:fmt(subDays(today,1)), updatedAt:fmt(subDays(today,1)) },
  // Mature Cheddar
  { id:'db-005', productId:'prod-003', batchCode:'MC-D101', quantity:14, initialQuantity:20, expiryDate:fmt(addDays(today,21)), purchaseCost:1.80, sellingPrice:3.25, supplierId:'sup-001', storageLocation:'Chiller A3', status:'active', receivedDate:fmt(subDays(today,10)), createdAt:fmt(subDays(today,10)), updatedAt:fmt(subDays(today,10)) },
  // Free Range Eggs — low stock
  { id:'db-006', productId:'prod-004', batchCode:'FRE-D101', quantity:3, initialQuantity:24, expiryDate:fmt(addDays(today,5)), purchaseCost:1.60, sellingPrice:2.85, supplierId:'sup-001', storageLocation:'Chiller B1', status:'active', receivedDate:fmt(subDays(today,12)), createdAt:fmt(subDays(today,12)), updatedAt:fmt(subDays(today,12)) },
  // Sourdough — expired
  { id:'db-007', productId:'prod-005', batchCode:'SD-D101', quantity:0, initialQuantity:12, expiryDate:fmt(subDays(today,1)), purchaseCost:1.20, sellingPrice:2.40, supplierId:'sup-003', storageLocation:'Bakery Shelf 1', status:'expired', receivedDate:fmt(subDays(today,3)), createdAt:fmt(subDays(today,3)), updatedAt:fmt(subDays(today,1)) },
  { id:'db-008', productId:'prod-005', batchCode:'SD-D102', quantity:8, initialQuantity:15, expiryDate:fmt(addDays(today,1)), purchaseCost:1.20, sellingPrice:2.40, supplierId:'sup-003', storageLocation:'Bakery Shelf 1', status:'active', receivedDate:fmt(subDays(today,2)), createdAt:fmt(subDays(today,2)), updatedAt:fmt(subDays(today,2)) },
  // Croissants — expires today
  { id:'db-009', productId:'prod-006', batchCode:'CR-D101', quantity:6, initialQuantity:20, expiryDate:fmt(addDays(today,0)), purchaseCost:0.90, sellingPrice:1.80, supplierId:'sup-003', storageLocation:'Bakery Shelf 2', status:'active', receivedDate:fmt(subDays(today,2)), createdAt:fmt(subDays(today,2)), updatedAt:fmt(subDays(today,2)) },
  // Chicken Breast
  { id:'db-010', productId:'prod-007', batchCode:'CB-D101', quantity:8, initialQuantity:15, expiryDate:fmt(addDays(today,2)), purchaseCost:2.50, sellingPrice:4.50, supplierId:'sup-005', storageLocation:'Chiller C1', status:'active', receivedDate:fmt(subDays(today,4)), createdAt:fmt(subDays(today,4)), updatedAt:fmt(subDays(today,4)) },
  { id:'db-011', productId:'prod-007', batchCode:'CB-D102', quantity:20, initialQuantity:20, expiryDate:fmt(addDays(today,6)), purchaseCost:2.50, sellingPrice:4.50, supplierId:'sup-005', storageLocation:'Chiller C1', status:'active', receivedDate:fmt(subDays(today,1)), createdAt:fmt(subDays(today,1)), updatedAt:fmt(subDays(today,1)) },
  // Beef Mince — expires tomorrow
  { id:'db-012', productId:'prod-008', batchCode:'BM-D101', quantity:6, initialQuantity:18, expiryDate:fmt(addDays(today,1)), purchaseCost:2.30, sellingPrice:4.20, supplierId:'sup-005', storageLocation:'Chiller C2', status:'active', receivedDate:fmt(subDays(today,5)), createdAt:fmt(subDays(today,5)), updatedAt:fmt(subDays(today,5)) },
  // Atlantic Salmon
  { id:'db-013', productId:'prod-009', batchCode:'SF-D101', quantity:8, initialQuantity:12, expiryDate:fmt(addDays(today,3)), purchaseCost:4.20, sellingPrice:6.99, supplierId:'sup-004', storageLocation:'Chiller D1', status:'active', receivedDate:fmt(subDays(today,3)), createdAt:fmt(subDays(today,3)), updatedAt:fmt(subDays(today,3)) },
  // Baby Spinach — expired
  { id:'db-014', productId:'prod-010', batchCode:'BS-D101', quantity:2, initialQuantity:30, expiryDate:fmt(subDays(today,2)), purchaseCost:0.70, sellingPrice:1.40, supplierId:'sup-002', storageLocation:'Produce A1', status:'expired', receivedDate:fmt(subDays(today,9)), createdAt:fmt(subDays(today,9)), updatedAt:fmt(subDays(today,2)) },
  { id:'db-015', productId:'prod-010', batchCode:'BS-D102', quantity:22, initialQuantity:30, expiryDate:fmt(addDays(today,4)), purchaseCost:0.70, sellingPrice:1.40, supplierId:'sup-002', storageLocation:'Produce A1', status:'active', receivedDate:fmt(subDays(today,2)), createdAt:fmt(subDays(today,2)), updatedAt:fmt(subDays(today,2)) },
  // Strawberries
  { id:'db-016', productId:'prod-011', batchCode:'STR-D101', quantity:18, initialQuantity:24, expiryDate:fmt(addDays(today,2)), purchaseCost:1.20, sellingPrice:2.20, supplierId:'sup-002', storageLocation:'Produce A2', status:'active', receivedDate:fmt(subDays(today,3)), createdAt:fmt(subDays(today,3)), updatedAt:fmt(subDays(today,3)) },
  // Orange Juice — low stock
  { id:'db-017', productId:'prod-014', batchCode:'OJ-D101', quantity:4, initialQuantity:36, expiryDate:fmt(addDays(today,7)), purchaseCost:1.10, sellingPrice:1.99, supplierId:'sup-002', storageLocation:'Chiller E1', status:'active', receivedDate:fmt(subDays(today,20)), createdAt:fmt(subDays(today,20)), updatedAt:fmt(subDays(today,20)) },
  { id:'db-018', productId:'prod-014', batchCode:'OJ-D102', quantity:36, initialQuantity:36, expiryDate:fmt(addDays(today,25)), purchaseCost:1.10, sellingPrice:1.99, supplierId:'sup-002', storageLocation:'Chiller E1', status:'active', receivedDate:fmt(subDays(today,3)), createdAt:fmt(subDays(today,3)), updatedAt:fmt(subDays(today,3)) },
  // Butter
  { id:'db-019', productId:'prod-015', batchCode:'BU-D101', quantity:28, initialQuantity:30, expiryDate:fmt(addDays(today,45)), purchaseCost:1.05, sellingPrice:1.85, supplierId:'sup-001', storageLocation:'Chiller A4', status:'active', receivedDate:fmt(subDays(today,5)), createdAt:fmt(subDays(today,5)), updatedAt:fmt(subDays(today,5)) },
  // Smoked Salmon
  { id:'db-020', productId:'prod-012', batchCode:'SS-D101', quantity:12, initialQuantity:18, expiryDate:fmt(addDays(today,5)), purchaseCost:2.10, sellingPrice:3.50, supplierId:'sup-006', storageLocation:'Deli Counter A', status:'active', receivedDate:fmt(subDays(today,4)), createdAt:fmt(subDays(today,4)), updatedAt:fmt(subDays(today,4)) },
];

// ── Demo operations ───────────────────────────────────────────────────────────
export const demoOperations: Operation[] = [
  { id:'dop-001', title:'Remove expired Baby Spinach from shelf', description:'Batch BS-D101 has passed its expiry date. Remove all units immediately and dispose according to store policy.', type:'remove-expired', priority:'critical', status:'pending', productId:'prod-010', batchId:'db-014', assignedUserId:'demo-user-002', dueDate:fmt(today), sourceWorkflowId:'wf-002', sourceWorkflowName:'Expired Product Protection', createdAt:fmt(subDays(today,1)), updatedAt:fmt(subDays(today,1)), completedAt:null, completedBy:null, notes:null },
  { id:'dop-002', title:'Review Greek Yogurt for discount', description:'Batch GY-D101 (24 units) expires in 3 days. Consider applying a 25% discount to accelerate sales and reduce waste.', type:'discount-review', priority:'high', status:'in-progress', productId:'prod-002', batchId:'db-003', assignedUserId:'demo-user-001', dueDate:fmt(addDays(today,1)), sourceWorkflowId:'wf-001', sourceWorkflowName:'Expiry Protection', createdAt:fmt(subDays(today,1)), updatedAt:fmt(today), completedAt:null, completedBy:null, notes:'25% markdown approved by manager.' },
  { id:'dop-003', title:'Move Whole Milk to priority shelf', description:'Batch WM-D001 (18 units) expires in 2 days. Move to front of chiller to prioritise FEFO rotation.', type:'priority-shelf', priority:'high', status:'pending', productId:'prod-001', batchId:'db-001', assignedUserId:'demo-user-003', dueDate:fmt(today), sourceWorkflowId:'wf-001', sourceWorkflowName:'Expiry Protection', createdAt:fmt(subDays(today,2)), updatedAt:fmt(subDays(today,2)), completedAt:null, completedBy:null, notes:null },
  { id:'dop-004', title:'Restock Free Range Eggs', description:'Only 3 units remaining in batch FRE-D101. Stock is critically low. Raise a purchase request with Meadow Fresh Dairy.', type:'restock', priority:'high', status:'pending', productId:'prod-004', batchId:'db-006', assignedUserId:'demo-user-001', dueDate:fmt(addDays(today,1)), sourceWorkflowId:'wf-003', sourceWorkflowName:'Low Stock Protection', createdAt:fmt(subDays(today,1)), updatedAt:fmt(subDays(today,1)), completedAt:null, completedBy:null, notes:null },
  { id:'dop-005', title:'Remove expired Sourdough Loaf', description:'Batch SD-D101 expired yesterday. All remaining units must be removed and logged.', type:'remove-expired', priority:'critical', status:'completed', productId:'prod-005', batchId:'db-007', assignedUserId:'demo-user-002', dueDate:fmt(subDays(today,1)), sourceWorkflowId:'wf-002', sourceWorkflowName:'Expired Product Protection', createdAt:fmt(subDays(today,2)), updatedAt:fmt(subDays(today,1)), completedAt:fmt(subDays(today,1)), completedBy:'Marcus Chen', notes:'All 12 units removed and logged. Supplier notified.' },
  { id:'dop-006', title:'Inspect Beef Mince — expires tomorrow', description:'Batch BM-D101 (6 units) expires tomorrow. Inspect quality and decide on markdown or removal.', type:'batch-inspect', priority:'critical', status:'pending', productId:'prod-008', batchId:'db-012', assignedUserId:'demo-user-002', dueDate:fmt(today), sourceWorkflowId:'wf-001', sourceWorkflowName:'Expiry Protection', createdAt:fmt(today), updatedAt:fmt(today), completedAt:null, completedBy:null, notes:null },
  { id:'dop-007', title:'Restock Orange Juice — critically low', description:'Only 4 units of OJ-D101 remaining. Contact Greenfield Farms to arrange urgent delivery.', type:'restock', priority:'critical', status:'in-progress', productId:'prod-014', batchId:'db-017', assignedUserId:'demo-user-001', dueDate:fmt(addDays(today,1)), sourceWorkflowId:'wf-003', sourceWorkflowName:'Low Stock Protection', createdAt:fmt(subDays(today,1)), updatedAt:fmt(today), completedAt:null, completedBy:null, notes:'Awaiting supplier confirmation.' },
  { id:'dop-008', title:'Remove expired Baby Spinach — prior batch', description:'Batch BS-D101 disposal confirmed. Waste log updated.', type:'remove-expired', priority:'critical', status:'completed', productId:'prod-010', batchId:'db-014', assignedUserId:'demo-user-003', dueDate:fmt(subDays(today,2)), sourceWorkflowId:'wf-002', sourceWorkflowName:'Expired Product Protection', createdAt:fmt(subDays(today,3)), updatedAt:fmt(subDays(today,2)), completedAt:fmt(subDays(today,2)), completedBy:'Sophie Blake', notes:'2 units disposed. Waste recorded.' },
  { id:'dop-009', title:'Apply discount to Croissants — expires today', description:'Batch CR-D101 (6 units) expires today. Apply 40% markdown immediately.', type:'discount-review', priority:'critical', status:'pending', productId:'prod-006', batchId:'db-009', assignedUserId:'demo-user-002', dueDate:fmt(today), sourceWorkflowId:'wf-001', sourceWorkflowName:'Expiry Protection', createdAt:fmt(subHours(today,2)), updatedAt:fmt(subHours(today,2)), completedAt:null, completedBy:null, notes:null },
];

// ── Demo notifications ────────────────────────────────────────────────────────
export const demoNotifications: Notification[] = [
  { id:'dn-001', type:'critical-expiry', title:'Croissants expire today', message:'Batch CR-D101 (6 units) expires today. Immediate action required.', isRead:false, relatedEntityId:'prod-006', relatedEntityType:'product', createdAt:subMinutes(today,8).toISOString() },
  { id:'dn-002', type:'critical-expiry', title:'Beef Mince expires tomorrow', message:'Batch BM-D101 (6 units) expires in 1 day. Estimated value at risk: £25.20.', isRead:false, relatedEntityId:'prod-008', relatedEntityType:'product', createdAt:subMinutes(today,15).toISOString() },
  { id:'dn-003', type:'workflow-executed', title:'Expiry Protection workflow triggered', message:'Workflow ran for Greek Yogurt batch GY-D101. Operation created and manager notified.', isRead:false, relatedEntityId:'wf-001', relatedEntityType:'workflow', createdAt:subMinutes(today,42).toISOString() },
  { id:'dn-004', type:'operation-assigned', title:'New operation assigned to you', message:'Review Greek Yogurt for discount — due tomorrow.', isRead:false, relatedEntityId:'dop-002', relatedEntityType:'operation', createdAt:subHours(today,1).toISOString() },
  { id:'dn-005', type:'low-stock', title:'Free Range Eggs critically low', message:'Only 3 units remaining. Minimum stock level is 12 units.', isRead:true, relatedEntityId:'prod-004', relatedEntityType:'product', createdAt:subHours(today,2).toISOString() },
  { id:'dn-006', type:'product-expired', title:'Baby Spinach batch expired', message:'Batch BS-D101 has passed its expiry date. Removal operation has been created.', isRead:true, relatedEntityId:'prod-010', relatedEntityType:'product', createdAt:subHours(today,3).toISOString() },
  { id:'dn-007', type:'workflow-executed', title:'Expired Product Protection triggered', message:'Workflow ran for Sourdough Loaf batch SD-D101. Product marked as expired.', isRead:true, relatedEntityId:'wf-002', relatedEntityType:'workflow', createdAt:subHours(today,5).toISOString() },
  { id:'dn-008', type:'operation-overdue', title:'Operation overdue: Remove expired Baby Spinach', message:'This operation was due yesterday and has not been completed.', isRead:true, relatedEntityId:'dop-001', relatedEntityType:'operation', createdAt:subHours(today,8).toISOString() },
];
