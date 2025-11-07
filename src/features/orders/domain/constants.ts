import type { Order } from './types';
import { MENU_ITEMS } from '@/features/menu/domain/constants';

export const ORDERS: Order[] = [
    {
        id: 'o1', tableId: 't2',
        items: [
            { menuItem: MENU_ITEMS.find(i => i.id === '29102025002')!, quantity: 1, notes: 'Extra cheese', size: 'Regular' },
            { menuItem: MENU_ITEMS.find(i => i.id === '29102025003')!, quantity: 1, notes: '', size: '12-inch' },
            { menuItem: MENU_ITEMS.find(i => i.id === '29102025007')!, quantity: 2, notes: '', size: 'Regular' },
        ],
        subtotal: 39.00, discount: 0, total: 39.00, createdAt: Date.now() - 3600000,
    },
    {
        id: 'o2', tableId: 't6',
        items: [
            { menuItem: MENU_ITEMS.find(i => i.id === '29102025001')!, quantity: 1, notes: '', size: 'Standard' },
        ],
        subtotal: 8.50, discount: 0, total: 8.50, createdAt: Date.now() - 7200000, closedAt: Date.now() - 1800000,
    },
    {
        id: 'o3', tableId: 't8',
        items: [
            { menuItem: MENU_ITEMS.find(i => i.id === '29102025005')!, quantity: 1, notes: '', size: 'Standard' },
            { menuItem: MENU_ITEMS.find(i => i.id === '29102025006')!, quantity: 1, notes: 'With extra berries', size: 'Standard' },
        ],
        subtotal: 17.00, discount: 10, total: 15.30, createdAt: Date.now() - 900000,
    },
];

