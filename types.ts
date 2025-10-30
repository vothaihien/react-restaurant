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

export type View = 'dashboard' | 'menu' | 'reports' | 'settings';