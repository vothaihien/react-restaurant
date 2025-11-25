import type { MenuItem } from '@/types/menu';

export enum PaymentMethod {
    Cash = 'Cash',
    Card = 'Card',
    Transfer = 'Transfer',
}

export interface OrderItem {
    menuItem: MenuItem;
    quantity: number;
    notes: string;
    size: string; // The name of the size, e.g., 'S'
}

export interface Order {
    id: string;
    tableId: string;
    items: OrderItem[];
    subtotal: number;
    discount: number; // percentage
    total: number;
    createdAt: number; // timestamp
    closedAt?: number;
    paymentMethod?: PaymentMethod;
}



