import type { Table } from './types';
import { TableStatus } from './types';

export const TABLES: Table[] = [
    { id: 't1', name: 'Bàn 1', capacity: 2, status: TableStatus.Available, orderId: null },
    { id: 't2', name: 'Bàn 2', capacity: 4, status: TableStatus.Occupied, orderId: 'o1' },
    { id: 't3', name: 'Bàn 3', capacity: 4, status: TableStatus.Available, orderId: null },
    { id: 't4', name: 'Bàn 4', capacity: 6, status: TableStatus.Reserved, orderId: null },
    { id: 't5', name: 'Bàn 5', capacity: 2, status: TableStatus.Available, orderId: null },
    { id: 't6', name: 'Bàn 6', capacity: 8, status: TableStatus.CleaningNeeded, orderId: 'o2' },
    { id: 't7', name: 'Bàn 7', capacity: 4, status: TableStatus.Available, orderId: null },
    { id: 't8', name: 'Bàn 8', capacity: 4, status: TableStatus.Occupied, orderId: 'o3' },
    { id: 't9', name: 'Bàn 9', capacity: 2, status: TableStatus.Available, orderId: null },
    { id: 't10', name: 'Bàn 10', capacity: 6, status: TableStatus.Available, orderId: null },
];

