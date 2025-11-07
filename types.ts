export enum TableStatus {
    Available = 'Available',
    Occupied = 'Occupied',
    Reserved = 'Reserved',
    CleaningNeeded = 'Cleaning Needed',
}

export interface Table {
    id: string;
    name: string;
    capacity: number;
    status: TableStatus;
    orderId?: string | null;
}

export interface Category {
    id: string;
    name: string;
}

export enum Unit {
    Kg = 'Kg',
    g = 'g',
    Bottle = 'Bottle',
    Pcs = 'Pcs',
    L = 'L',
    ml = 'ml',
}

export interface Ingredient {
    id: string;
    name: string;
    unit: Unit;
    stock: number;
    minStock?: number; // threshold for low stock alert
}

export interface RecipeIngredient {
    ingredient: Ingredient;
    quantity: number;
}

// NEW: Recipe interface
export interface Recipe {
    id: string; // Auto-generated: DDMMYYYYNNN
    name: string;
    ingredients: RecipeIngredient[];
}

// MODIFIED: MenuItemSize now contains a full Recipe object
export interface MenuItemSize {
    name: string; // e.g., 'S', 'M', 'L'
    price: number;
    recipe: Recipe;
}

export interface MenuItem {
    id: string; // Auto-generated: DDMMYYYYNNN
    name: string;
    description: string;
    category: string;
    imageUrls: string[];
    inStock: boolean;
    sizes: MenuItemSize[];
}

export interface OrderItem {
    menuItem: MenuItem;
    quantity: number;
    notes: string;
    size: string; // The name of the size, e.g., 'S'
}

export enum PaymentMethod {
    Cash = 'Cash',
    Card = 'Card',
    Transfer = 'Transfer',
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

// Reservation Management
export type ReservationStatus = 'Booked' | 'Seated' | 'Cancelled' | 'NoShow';

export interface Reservation {
    id: string; // Auto-generated: DDMMYYYYNNN
    customerName: string;
    phone?: string;
    partySize: number;
    time: number; // timestamp
    status: ReservationStatus;
    tableId?: string | null;
    source?: 'App' | 'Phone' | 'InPerson';
    notes?: string;
}

// Inventory & Procurement
export interface Supplier {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

export type InventoryTxnType = 'IN' | 'ADJUST' | 'CONSUME';

export interface InventoryTransactionItem {
    ingredientId: string;
    quantity: number;
    unitCost?: number; // for IN transactions
}

export interface InventoryTransaction {
    id: string; // Auto-generated: DDMMYYYYNNN
    type: InventoryTxnType;
    items: InventoryTransactionItem[];
    supplierId?: string; // for IN
    createdAt: number;
    note?: string;
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

// Staff & Roles
export type Role = 'Admin' | 'Manager' | 'Cashier' | 'Waiter' | 'Kitchen';

export interface Staff {
    id: string;
    name: string;
    username: string;
    role: Role;
    active: boolean;
}

export type View =
    | 'dashboard' // POS tables
    | 'menu'
    | 'reservations'
    | 'inventory'
    | 'masterdata'
    | 'kds'
    | 'customer'
    | 'reports'
    | 'settings';