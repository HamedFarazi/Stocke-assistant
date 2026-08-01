import type { Store } from '@/types';

export const stores: Store[] = [
  {
    id: 'store-001',
    name: 'FreshFlow Hackney',
    address: '42 Mare Street',
    postcode: 'E8 4RT',
    manager: 'Sarah Mitchell',
    phone: '020 7946 0312',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'store-002',
    name: 'FreshFlow Islington',
    address: '18 Upper Street',
    postcode: 'N1 0PN',
    manager: 'James Okonkwo',
    phone: '020 7946 0489',
    createdAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'store-003',
    name: 'FreshFlow Peckham',
    address: '76 Rye Lane',
    postcode: 'SE15 4ST',
    manager: 'Priya Sharma',
    phone: '020 7946 0755',
    createdAt: '2024-06-20T09:00:00Z',
  },
];
