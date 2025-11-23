// Re-export all types for backward compatibility
export * from '@/features/tables/domain/types';
export * from '@/features/menu/domain/types';
export * from '@/features/orders/domain/types';
export * from '@/features/reservations/domain/types';
export * from '@/features/inventory/domain/types';

// Global types
export type View =
    | 'dashboard' // POS tables
    | 'menu'
    | 'reservations'
    | 'inventory'
    | 'masterdata'
    | 'employees'
    | 'kds'
    | 'customer'
    | 'reports'
    | 'settings';

export type Role = 'Admin' | 'Manager' | 'Cashier' | 'Waiter' | 'Kitchen';

export interface Staff {
    id: string;
    name: string;
    username: string;
    role: Role;
    active: boolean;
}

// KDS (Kitchen Display System)
export interface KDSItem {
    id: string;
    orderId: string;
    tableName: string;
    items: { name: string; size: string; qty: number; notes?: string }[];
    createdAt: number;
    status: 'Queued' | 'InProgress' | 'Done';
}

// Feedback types
export type FeedbackTone = 'info' | 'success' | 'warning' | 'error';

export interface FeedbackNotification {
    id: string;
    tone: FeedbackTone;
    title: string;
    description?: string;
    duration?: number;
}

export type FeedbackDialogTone = 'primary' | 'danger';

export interface FeedbackDialogState {
    title: string;
    description?: string;
    confirmText: string;
    cancelText: string;
    tone: FeedbackDialogTone;
}
