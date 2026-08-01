import type { AnalyticsDataPoint, CategoryRisk, WorkflowStats } from '@/types';
import { subDays, format } from 'date-fns';

const fmt = (d: Date) => format(d, 'MMM d');
const today = new Date();

export const expiredValueOverTime: AnalyticsDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: fmt(subDays(today, 29 - i)),
  value: Math.round((Math.random() * 80 + 20) * 100) / 100,
}));

export const wastePrevented: AnalyticsDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: fmt(subDays(today, 29 - i)),
  value: Math.round((Math.random() * 120 + 40) * 100) / 100,
}));

export const productsSavedFromExpiry: AnalyticsDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: fmt(subDays(today, 29 - i)),
  value: Math.floor(Math.random() * 15 + 3),
}));

export const expiryRiskByCategory: CategoryRisk[] = [
  { category: 'Dairy', value: 342.50, count: 12 },
  { category: 'Bakery', value: 86.40, count: 8 },
  { category: 'Meat & Poultry', value: 214.20, count: 6 },
  { category: 'Produce', value: 68.60, count: 10 },
  { category: 'Seafood', value: 195.72, count: 4 },
  { category: 'Deli', value: 112.00, count: 5 },
];

export const lowStockTrend: AnalyticsDataPoint[] = Array.from({ length: 14 }, (_, i) => ({
  date: fmt(subDays(today, 13 - i)),
  value: Math.floor(Math.random() * 6 + 2),
}));

export const workflowStats: WorkflowStats[] = [
  { workflowId: 'wf-001', workflowName: 'Expiry Protection', executions: 14, successRate: 93, operationsCreated: 12 },
  { workflowId: 'wf-002', workflowName: 'Expired Product Protection', executions: 6, successRate: 100, operationsCreated: 6 },
  { workflowId: 'wf-003', workflowName: 'Low Stock Protection', executions: 9, successRate: 89, operationsCreated: 8 },
  { workflowId: 'wf-004', workflowName: 'High Risk Expiry', executions: 3, successRate: 100, operationsCreated: 3 },
];

export const operationsCompleted: AnalyticsDataPoint[] = Array.from({ length: 14 }, (_, i) => ({
  date: fmt(subDays(today, 13 - i)),
  value: Math.floor(Math.random() * 5 + 1),
}));

export const avgResolutionTime: AnalyticsDataPoint[] = Array.from({ length: 14 }, (_, i) => ({
  date: fmt(subDays(today, 13 - i)),
  value: Math.round((Math.random() * 6 + 1) * 10) / 10,
}));
