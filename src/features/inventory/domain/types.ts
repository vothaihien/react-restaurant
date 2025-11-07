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

