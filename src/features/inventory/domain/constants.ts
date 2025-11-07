import type { Ingredient, Supplier } from './types';
import { Unit } from './types';

export const INGREDIENTS: Ingredient[] = [
    { id: 'ing1', name: 'Baguette', unit: Unit.Pcs, stock: 50, minStock: 10 },
    { id: 'ing2', name: 'Tomato', unit: Unit.Kg, stock: 10, minStock: 3 },
    { id: 'ing3', name: 'Garlic', unit: Unit.Kg, stock: 5, minStock: 1 },
    { id: 'ing4', name: 'Basil', unit: Unit.g, stock: 500, minStock: 100 },
    { id: 'ing5', name: 'Mozzarella', unit: Unit.Kg, stock: 8, minStock: 2 },
    { id: 'ing6', name: 'Spaghetti', unit: Unit.Kg, stock: 20, minStock: 5 },
    { id: 'ing7', name: 'Eggs', unit: Unit.Pcs, stock: 100, minStock: 24 },
    { id: 'ing8', name: 'Pancetta', unit: Unit.Kg, stock: 5, minStock: 1 },
    { id: 'ing9', name: 'Pizza Dough', unit: Unit.Pcs, stock: 30, minStock: 10 },
    { id: 'ing10', name: 'Pizza Sauce', unit: Unit.L, stock: 10, minStock: 2 },
    { id: 'ing11', name: 'Salmon Fillet', unit: Unit.Kg, stock: 4, minStock: 1 },
    { id: 'ing12', name: 'Ladyfingers', unit: Unit.Pcs, stock: 40, minStock: 10 },
    { id: 'ing13', name: 'Mascarpone', unit: Unit.Kg, stock: 3, minStock: 1 },
    { id: 'ing14', name: 'Coffee Beans', unit: Unit.Kg, stock: 5, minStock: 1 },
    { id: 'ing15', name: 'Milk', unit: Unit.L, stock: 15, minStock: 5 },
    { id: 'ing16', name: 'Water Bottle', unit: Unit.Bottle, stock: 100, minStock: 20 },
];

export const SUPPLIERS: Supplier[] = [
    { id: 's1', name: 'FreshFarm Co.', phone: '+84 909 000 111', email: 'sales@freshfarm.vn' },
    { id: 's2', name: 'DairyBest LTD', phone: '+84 909 000 222', email: 'orders@dairybest.vn' },
];

