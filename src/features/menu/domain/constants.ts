import type { Category, MenuItem } from './types';
import type { Ingredient } from '@/features/inventory/domain/types';
import { Unit } from '@/features/inventory/domain/types';

export const CATEGORIES: Category[] = [
    { id: 'cat1', name: 'Khai vị' },
    { id: 'cat2', name: 'Món chính' },
    { id: 'cat3', name: 'Tráng miệng' },
    { id: 'cat4', name: 'Đồ uống' },
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

// Import INGREDIENTS from inventory to avoid circular dependency
import { INGREDIENTS } from '@/features/inventory/domain/constants';

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

