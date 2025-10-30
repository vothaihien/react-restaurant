import React, { useState, useEffect, useRef } from 'react';
import type { MenuItem, MenuItemSize, RecipeIngredient, Ingredient, Recipe } from '../types';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES, PREDEFINED_SIZES } from '../constants';
import { XIcon, PlusIcon, TrashIcon, ChevronDownIcon } from './Icons';

interface MenuItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemToEdit?: MenuItem | null;
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({ isOpen, onClose, itemToEdit }) => {
    const { addMenuItem, updateMenuItem, ingredients, generateRecipeId } = useAppContext();
    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
    const sizeDropdownRef = useRef<HTMLDivElement>(null);

    const getInitialState = (): Omit<MenuItem, 'id'> => ({
        name: '',
        description: '',
        category: CATEGORIES[0]?.name || '',
        imageUrls: [],
        inStock: true,
        sizes: [],
    });

    const [formState, setFormState] = useState(getInitialState());

    useEffect(() => {
        if (itemToEdit) {
            setFormState({
                name: itemToEdit.name,
                description: itemToEdit.description,
                category: itemToEdit.category,
                imageUrls: [...itemToEdit.imageUrls],
                inStock: itemToEdit.inStock,
                sizes: JSON.parse(JSON.stringify(itemToEdit.sizes)), // Deep copy
            });
        } else {
            setFormState(getInitialState());
        }
    }, [itemToEdit, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
                setIsSizeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
            const isChecked = e.target.checked;
            setFormState(prev => ({ ...prev, [name]: isChecked }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // Image Handlers
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                            setFormState(prev => ({
                                ...prev,
                                imageUrls: [...prev.imageUrls, reader.result as string]
                            }));
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };
    const handleRemoveImage = (index: number) => {
        setFormState(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
    };

    // Size Handlers
    const handleAddSize = (name: string = '') => {
        if (name && formState.sizes.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            alert(`Size "${name}" already exists for this item.`);
            setIsSizeDropdownOpen(false);
            return;
        }

        const newRecipe: Recipe = {
            id: generateRecipeId(),
            name: name ? `${formState.name || 'New Item'} ${name} Recipe` : '',
            ingredients: [],
        };
        const newSize: MenuItemSize = { name, price: 0, recipe: newRecipe };
        setFormState(prev => ({ ...prev, sizes: [...prev.sizes, newSize] }));
        setIsSizeDropdownOpen(false);
    };
    const handleRemoveSize = (index: number) => {
        setFormState(prev => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== index) }));
    };
    const handleSizeChange = (index: number, field: 'name' | 'price', value: string | number) => {
        const newSizes = [...formState.sizes];
        newSizes[index] = { ...newSizes[index], [field]: value };
        setFormState(prev => ({ ...prev, sizes: newSizes }));
    };

    // Recipe Handlers
    const handleRecipeNameChange = (sizeIndex: number, name: string) => {
        const newSizes = [...formState.sizes];
        newSizes[sizeIndex].recipe.name = name;
        setFormState(prev => ({ ...prev, sizes: newSizes }));
    };

    const handleAddIngredient = (sizeIndex: number) => {
        if (ingredients.length > 0) {
            const newIngredient: RecipeIngredient = { ingredient: ingredients[0], quantity: 0 };
            const newSizes = [...formState.sizes];
            newSizes[sizeIndex].recipe.ingredients.push(newIngredient);
            setFormState(prev => ({ ...prev, sizes: newSizes }));
        }
    };
    const handleRemoveIngredient = (sizeIndex: number, ingredientIndex: number) => {
        const newSizes = [...formState.sizes];
        newSizes[sizeIndex].recipe.ingredients = newSizes[sizeIndex].recipe.ingredients.filter((_, i) => i !== ingredientIndex);
        setFormState(prev => ({ ...prev, sizes: newSizes }));
    };
    const handleIngredientChange = (sizeIndex: number, ingredientIndex: number, field: 'ingredient' | 'quantity', value: string | number) => {
        const newSizes = [...formState.sizes];
        const recipeItem = newSizes[sizeIndex].recipe.ingredients[ingredientIndex];
        if (field === 'ingredient') {
             const selectedIngredient = ingredients.find(ing => ing.id === value);
             if(selectedIngredient) recipeItem.ingredient = selectedIngredient;
        } else {
            recipeItem.quantity = Number(value);
        }
        setFormState(prev => ({ ...prev, sizes: newSizes }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, description, category, imageUrls, inStock, sizes } = formState;

        if (!name || sizes.length === 0 || imageUrls.length === 0) {
            alert('Please enter an item name, and add at least one image and one size.');
            return;
        }

        const menuItemData = { name, description, category, imageUrls, inStock, sizes };
        if (itemToEdit) {
            updateMenuItem({ ...menuItemData, id: itemToEdit.id });
        } else {
            addMenuItem(menuItemData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">{itemToEdit ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <XIcon className="w-7 h-7" />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Basic Info */}
                     {itemToEdit && (
                        <div>
                            <label htmlFor="itemId" className="block text-sm font-medium text-gray-300">Item ID</label>
                            <input type="text" id="itemId" name="itemId" value={itemToEdit.id} readOnly className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm py-2 px-3 text-gray-400 cursor-not-allowed focus:outline-none focus:ring-0" />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Item Name</label>
                            <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                           <label htmlFor="category" className="block text-sm font-medium text-gray-300">Category</label>
                           <select id="category" name="category" value={formState.category} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                {CATEGORIES.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                           </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                        <textarea id="description" name="description" value={formState.description} onChange={handleInputChange} rows={2} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="flex items-center">
                        <input id="inStock" name="inStock" type="checkbox" checked={formState.inStock} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
                        <label htmlFor="inStock" className="ml-2 block text-sm text-gray-300">In Stock</label>
                    </div>

                    {/* Image Upload */}
                    <div className="border-t border-gray-700 pt-4">
                        <label className="block text-sm font-medium text-gray-300">Images</label>
                        <div className="mt-2 flex items-start gap-4">
                            <div className="flex-grow flex flex-wrap gap-2">
                                {formState.imageUrls.map((url, index) => (
                                    <div key={index} className="relative">
                                        <img src={url} alt={`Preview ${index}`} className="w-20 h-20 rounded-md object-cover"/>
                                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-lg transition-transform hover:scale-110">
                                            <XIcon className="w-3 h-3"/>
                                        </button>
                                    </div>
                                ))}
                                <label htmlFor="image-upload" className="cursor-pointer w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-md hover:border-indigo-500 hover:bg-gray-700 transition">
                                    <div className="text-center">
                                        <PlusIcon className="mx-auto h-6 w-6 text-gray-400" />
                                        <span className="mt-1 block text-xs font-medium text-gray-400">Upload</span>
                                    </div>
                                </label>
                            </div>
                            <input 
                                id="image-upload" 
                                name="image-upload" 
                                type="file" 
                                className="sr-only" 
                                multiple 
                                accept="image/*" 
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>

                    {/* Sizes and Recipes */}
                    <div className="border-t border-gray-700 pt-4 space-y-4">
                        <div className="flex justify-between items-center">
                           <h3 className="text-lg font-semibold text-white">Sizes &amp; Recipes</h3>
                            <div className="relative" ref={sizeDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsSizeDropdownOpen(prev => !prev)}
                                    className="flex items-center gap-1 text-sm py-1 px-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add Size
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isSizeDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                                        <div className="py-1">
                                            {PREDEFINED_SIZES.map(sizeName => (
                                                <button
                                                    key={sizeName}
                                                    type="button"
                                                    onClick={() => handleAddSize(sizeName)}
                                                    className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-indigo-600 hover:text-white"
                                                >
                                                    {sizeName}
                                                </button>
                                            ))}
                                            <div className="border-t border-gray-600 my-1"></div>
                                            <button
                                                type="button"
                                                onClick={() => handleAddSize()}
                                                className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-indigo-600 hover:text-white"
                                            >
                                                Custom Size
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {formState.sizes.map((size, sIndex) => (
                             <div key={sIndex} className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Size Name</label>
                                                <input type="text" placeholder="e.g., Large" value={size.name} onChange={e => handleSizeChange(sIndex, 'name', e.target.value)} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-1 px-2 text-sm text-white"/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Price</label>
                                                <input type="number" placeholder="12.50" value={size.price} onChange={e => handleSizeChange(sIndex, 'price', parseFloat(e.target.value))} required min="0" step="0.01" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-1 px-2 text-sm text-white"/>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveSize(sIndex)} className="text-red-400 hover:text-red-300 mt-1"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                                <div className="border-t border-gray-700 pt-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                             <label className="block text-xs font-medium text-gray-400">Recipe Name</label>
                                             <input type="text" placeholder="e.g., Large Carbonara Recipe" value={size.recipe.name} onChange={e => handleRecipeNameChange(sIndex, e.target.value)} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-1 px-2 text-sm text-white"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400">Recipe ID</label>
                                            <input type="text" value={size.recipe.id} readOnly className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md py-1 px-2 text-sm text-gray-400 cursor-not-allowed"/>
                                        </div>
                                    </div>
                                    <div className="pt-2 space-y-2">
                                         <div className="flex justify-between items-center">
                                           <h4 className="text-sm font-medium text-gray-300">Ingredients</h4>
                                            <button type="button" onClick={() => handleAddIngredient(sIndex)} className="flex items-center gap-1 text-xs py-1 px-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                                                <PlusIcon className="w-3 h-3" /> Add
                                            </button>
                                         </div>
                                         {size.recipe.ingredients.map((recipeItem, rIndex) => (
                                             <div key={rIndex} className="flex items-center gap-2">
                                                 <select value={recipeItem.ingredient.id} onChange={e => handleIngredientChange(sIndex, rIndex, 'ingredient', e.target.value)} className="flex-grow bg-gray-700 border-gray-600 rounded-md py-1 px-2 text-xs text-white">
                                                    {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                                                 </select>
                                                 <input type="number" placeholder="Qty" value={recipeItem.quantity} onChange={e => handleIngredientChange(sIndex, rIndex, 'quantity', e.target.value)} min="0" step="any" className="w-20 bg-gray-700 border-gray-600 rounded-md py-1 px-2 text-xs text-white"/>
                                                 <button type="button" onClick={() => handleRemoveIngredient(sIndex, rIndex)} className="text-red-500 hover:text-red-400"><XIcon className="w-4 h-4"/></button>
                                             </div>
                                         ))}
                                         {size.recipe.ingredients.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No ingredients for this recipe yet.</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </form>
                <footer className="p-4 flex justify-end gap-3 border-t border-gray-700 flex-shrink-0 bg-gray-800 rounded-b-xl">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition">Cancel</button>
                    <button type="submit" onClick={handleSubmit} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition">Save Item</button>
                </footer>
            </div>
        </div>
    );
};

export default MenuItemModal;