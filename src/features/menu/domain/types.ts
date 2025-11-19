import type { Ingredient } from '@/features/inventory/domain/types';

export interface Category {
    id: string;
    name: string;
}

export interface RecipeIngredient {
    ingredient: Ingredient;
    quantity: number;
}

export interface Recipe {
    id: string; // Auto-generated: DDMMYYYYNNN
    name: string;
    ingredients: RecipeIngredient[];
}

export interface MenuItemSize {
    id?: string; // Auto-generated: DDMMYYYYNNN
    name: string; // e.g., 'S', 'M', 'L'
    price: number;
    recipe: Recipe;
}

export interface MenuItem {
    id: string; // Auto-generated: DDMMYYYYNNN
    name: string;
    description: string;
    categoryId?: string;
    category: string;
    imageUrls: string[];
    inStock: boolean;
    sizes: MenuItemSize[];
}

