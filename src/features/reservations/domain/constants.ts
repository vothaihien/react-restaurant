import type { Reservation } from './types';
import type { KDSItem, Staff } from '@/core/types';

export const RESERVATIONS: Reservation[] = [
    { id: 'R01012025001', customerName: 'Nguyen Van A', phone: '0909000111', partySize: 4, time: Date.now() + 60 * 60 * 1000, status: 'Booked', tableId: 't4', source: 'Phone', notes: '' },
    { id: 'R01012025002', customerName: 'Tran Thi B', phone: '0909000222', partySize: 2, time: Date.now() + 2 * 60 * 60 * 1000, status: 'Booked', tableId: null, source: 'InPerson' },
];

export const KDS_QUEUE: KDSItem[] = [];

export const INVENTORY_TRANSACTIONS: any[] = [];

export const STAFFS: Staff[] = [
    { id: 'u1', name: 'Admin', username: 'admin', role: 'Admin', active: true },
    { id: 'u2', name: 'Cashier 1', username: 'cashier1', role: 'Cashier', active: true },
    { id: 'u3', name: 'Waiter 1', username: 'waiter1', role: 'Waiter', active: true },
];

