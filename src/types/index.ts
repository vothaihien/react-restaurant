export * from './inventory';
export * from './InventoryTypes';
export * from './menu';
export * from './orders';
export * from './reservations';
export * from './tables';

export type View =
  | 'dashboard'
  | 'menu'
  | 'reservations'
  | 'inventory'
  | 'masterdata'
  | 'employees'
  | 'kds'
  | 'customer'
  | 'reports';

export type Role = 'Admin' | 'Manager' | 'Cashier' | 'Waiter' | 'Kitchen';

export interface Staff {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
}

export interface KDSItem {
  id: string;
  orderId: string;
  tableName: string;
  items: { name: string; size: string; qty: number; notes?: string }[];
  createdAt: number;
  status: 'Queued' | 'InProgress' | 'Done';
}

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


