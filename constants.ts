import type { Table, MenuItem, Category, Order, Ingredient, Supplier, Reservation, KDSItem, InventoryTransaction, Staff } from './types';
import { TableStatus, Unit } from './types';

export const CATEGORIES: Category[] = [
    { id: 'cat1', name: 'Khai vị' },
    { id: 'cat2', name: 'Món chính' },
    { id: 'cat3', name: 'Tráng miệng' },
    { id: 'cat4', name: 'Đồ uống' },
];

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

export const PREDEFINED_SIZES: string[] = [
    'Standard',
    'Small',
    'Medium',
    'Large',
    'Regular',
    'Family',
    'Single',
    'Double',
    '12-inch',
    '16-inch',
];

export const MENU_ITEMS: MenuItem[] = [
    {
        id: '29102025001',
        name: 'Bruschetta',
        description: 'Toasted bread with garlic, topped with fresh tomatoes, basil, and olive oil.',
        category: 'Khai vị',
        imageUrls: ['https://picsum.photos/seed/bruschetta/400', 'https://picsum.photos/seed/bruschetta2/400'],
        inStock: true,
        sizes: [
            {
                name: 'Standard',
                price: 8.50,
                recipe: {
                    id: '29102025001',
                    name: 'Standard Bruschetta Recipe',
                    ingredients: [
                        { ingredient: INGREDIENTS[0], quantity: 1 }, // Baguette
                        { ingredient: INGREDIENTS[1], quantity: 0.2 }, // Tomato
                    ]
                },
            }
        ]
    },
    {
        id: '29102025002',
        name: 'Spaghetti Carbonara',
        description: 'Classic pasta dish with eggs, cheese, pancetta, and black pepper.',
        category: 'Món chính',
        imageUrls: ['https://picsum.photos/seed/carbonara/400'],
        inStock: true,
        sizes: [
            {
                name: 'Regular',
                price: 16.00,
                recipe: {
                    id: '29102025002',
                    name: 'Carbonara Recipe (Regular)',
                    ingredients: [
                        { ingredient: INGREDIENTS[5], quantity: 0.2 }, // Spaghetti
                        { ingredient: INGREDIENTS[6], quantity: 2 },   // Eggs
                        { ingredient: INGREDIENTS[7], quantity: 0.1 }, // Pancetta
                    ]
                },
            },
            {
                name: 'Large',
                price: 20.00,
                recipe: {
                    id: '29102025003',
                    name: 'Carbonara Recipe (Large)',
                    ingredients: [
                        { ingredient: INGREDIENTS[5], quantity: 0.3 },
                        { ingredient: INGREDIENTS[6], quantity: 3 },
                        { ingredient: INGREDIENTS[7], quantity: 0.15 },
                    ]
                },
            }
        ]
    },
    {
        id: '29102025003', name: 'Margherita Pizza',
        description: 'Simple and delicious pizza with tomato sauce, mozzarella, and fresh basil.',
        category: 'Món chính',
        imageUrls: ['https://picsum.photos/seed/pizza/400'],
        inStock: true,
        sizes: [
            {
                name: '12-inch',
                price: 14.00,
                recipe: {
                    id: '29102025004',
                    name: '12-inch Margherita Recipe',
                    ingredients: [
                        { ingredient: INGREDIENTS[8], quantity: 1 }, // Dough
                        { ingredient: INGREDIENTS[9], quantity: 0.2 }, // Sauce
                        { ingredient: INGREDIENTS[4], quantity: 0.1 }, // Mozzarella
                    ]
                },
            }
        ]
    },
    {
        id: '29102025004', name: 'Grilled Salmon',
        description: 'Healthy and flavorful grilled salmon fillet served with a side of vegetables.',
        category: 'Món chính',
        imageUrls: ['https://picsum.photos/seed/salmon/400'],
        inStock: false,
        sizes: [
            {
                name: 'Standard',
                price: 22.00,
                recipe: {
                    id: '29102025005',
                    name: 'Standard Salmon Recipe',
                    ingredients: [
                        { ingredient: INGREDIENTS[10], quantity: 0.25 }, // Salmon
                    ]
                },
            }
        ]
    },
    {
        id: '29102025005', name: 'Tiramisu', description: 'A coffee-flavoured Italian dessert.',
        category: 'Tráng miệng', imageUrls: ['https://picsum.photos/seed/tiramisu/400'], inStock: true,
        sizes: [{ name: 'Standard', price: 9.00, recipe: { id: '29102025006', name: 'Standard Tiramisu', ingredients: [{ ingredient: INGREDIENTS[11], quantity: 4 }] } }]
    },
    {
        id: '29102025006', name: 'Panna Cotta', description: 'An Italian dessert of sweetened cream thickened with gelatin.',
        category: 'Tráng miệng', imageUrls: ['https://picsum.photos/seed/panna/400'], inStock: true,
        sizes: [{ name: 'Standard', price: 8.00, recipe: { id: '29102025007', name: 'Standard Panna Cotta', ingredients: [{ ingredient: INGREDIENTS[12], quantity: 0.1 }] } }]
    },
    {
        id: '29102025007', name: 'Latte', description: 'Espresso with steamed milk.',
        category: 'Đồ uống', imageUrls: ['https://picsum.photos/seed/latte/400'], inStock: true,
        sizes: [
            { name: 'Regular', price: 4.50, recipe: { id: '29102025008', name: 'Latte Regular', ingredients: [{ ingredient: INGREDIENTS[14], quantity: 0.3 }] } },
            { name: 'Large', price: 5.50, recipe: { id: '29102025009', name: 'Latte Large', ingredients: [{ ingredient: INGREDIENTS[14], quantity: 0.4 }] } }
        ]
    }
];

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

// Suppliers
export const SUPPLIERS: Supplier[] = [
    { id: 's1', name: 'FreshFarm Co.', phone: '+84 909 000 111', email: 'sales@freshfarm.vn' },
    { id: 's2', name: 'DairyBest LTD', phone: '+84 909 000 222', email: 'orders@dairybest.vn' },
];

// Reservations (today samples)
export const RESERVATIONS: Reservation[] = [
    { id: 'R01012025001', customerName: 'Nguyen Van A', phone: '0909000111', partySize: 4, time: Date.now() + 60 * 60 * 1000, status: 'Booked', tableId: 't4', source: 'Phone', notes: '' },
    { id: 'R01012025002', customerName: 'Tran Thi B', phone: '0909000222', partySize: 2, time: Date.now() + 2 * 60 * 60 * 1000, status: 'Booked', tableId: null, source: 'InPerson' },
];

// KDS Queue
export const KDS_QUEUE: KDSItem[] = [];

// Inventory Transactions (history placeholder)
export const INVENTORY_TRANSACTIONS: InventoryTransaction[] = [];

// Staffs
export const STAFFS: Staff[] = [
    { id: 'u1', name: 'Admin', username: 'admin', role: 'Admin', active: true },
    { id: 'u2', name: 'Cashier 1', username: 'cashier1', role: 'Cashier', active: true },
    { id: 'u3', name: 'Waiter 1', username: 'waiter1', role: 'Waiter', active: true },
];