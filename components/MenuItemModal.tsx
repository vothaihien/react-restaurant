import React, { useState, useEffect, useRef } from 'react';
import type { MenuItem, MenuItemSize, RecipeIngredient, Ingredient, Recipe } from '@/features/menu/domain/types';
import { useAppContext } from '@/core/context/AppContext';
import { useFeedback } from '@/core/context/FeedbackContext';
import { CATEGORIES, PREDEFINED_SIZES } from '@/features/menu/domain/constants';
import { XIcon, PlusIcon, TrashIcon, ChevronDownIcon } from '@/components/Icons';

interface MenuItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemToEdit?: MenuItem | null;
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({ isOpen, onClose, itemToEdit }) => {
    const { addMenuItem, updateMenuItem, ingredients, generateRecipeId } = useAppContext();
    const { notify } = useFeedback();
    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
    const sizeDropdownRef = useRef<HTMLDivElement>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipeForIngredients, setSelectedRecipeForIngredients] = useState<string | null>(null);

    const getInitialState = (): Omit<MenuItem, 'id'> => ({
        name: '',
        description: '',
        category: CATEGORIES[0]?.name || '',
        imageUrls: [],
        inStock: true,
        sizes: [],
    });

    const [formState, setFormState] = useState(getInitialState());

    // Helper function to generate unique recipe ID
    const generateUniqueRecipeId = (): string => {
        let newId = generateRecipeId();
        let attempts = 0;
        const allRecipeIds = [
            ...recipes.map(r => r.id),
            ...formState.sizes.map(s => s.recipe.id)
        ];
        while (allRecipeIds.includes(newId) && attempts < 100) {
            newId = generateRecipeId();
            attempts++;
        }
        if (attempts >= 100) {
            // Fallback: use timestamp + random
            newId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return newId;
    };

    // Helper function to generate unique recipe name
    const generateUniqueRecipeName = (): string => {
        const existingNames = recipes.map(r => r.name);
        let recipeNumber = 1;
        let newName = `Công thức ${recipeNumber}`;

        // Find the next available number
        while (existingNames.includes(newName)) {
            recipeNumber++;
            newName = `Công thức ${recipeNumber}`;
        }

        return newName;
    };

    useEffect(() => {
        if (itemToEdit) {
            const sizes = JSON.parse(JSON.stringify(itemToEdit.sizes)); // Deep copy
            setFormState({
                name: itemToEdit.name,
                description: itemToEdit.description,
                category: itemToEdit.category,
                imageUrls: [...itemToEdit.imageUrls],
                inStock: itemToEdit.inStock,
                sizes: sizes,
            });
            // Extract unique recipes from sizes (remove duplicates by ID)
            const recipeMap = new Map<string, Recipe>();
            sizes.forEach((s: MenuItemSize) => {
                if (!recipeMap.has(s.recipe.id)) {
                    recipeMap.set(s.recipe.id, JSON.parse(JSON.stringify(s.recipe))); // Deep copy
                }
            });
            const uniqueRecipes = Array.from(recipeMap.values());
            setRecipes(uniqueRecipes);
        } else {
            setFormState(getInitialState());
            setRecipes([]);
        }
        setSelectedRecipeForIngredients(null);
    }, [itemToEdit, isOpen]);

    // Remove duplicate recipes by ID
    useEffect(() => {
        const uniqueRecipesMap = new Map<string, Recipe>();
        recipes.forEach(r => {
            if (!uniqueRecipesMap.has(r.id)) {
                uniqueRecipesMap.set(r.id, r);
            }
        });
        const uniqueRecipes = Array.from(uniqueRecipesMap.values());
        // Only update if there are actual duplicates (different length or different IDs)
        const hasDuplicates = uniqueRecipes.length !== recipes.length ||
            recipes.some((r, idx) => recipes.findIndex(r2 => r2.id === r.id) !== idx);
        if (hasDuplicates) {
            setRecipes(uniqueRecipes);
        }
    }, [recipes.length, recipes.map(r => r.id).join(',')]);

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
            const files = Array.from(e.target.files) as File[];
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
            notify({
                tone: 'warning',
                title: 'Size trùng lặp',
                description: `Size "${name}" đã tồn tại cho món này.`,
            });
            setIsSizeDropdownOpen(false);
            return;
        }

        // Use first recipe if available, otherwise create new recipe and add to recipes list
        let defaultRecipe: Recipe;
        if (recipes.length > 0) {
            defaultRecipe = JSON.parse(JSON.stringify(recipes[0])); // Deep copy
        } else {
            const newId = generateUniqueRecipeId();
            defaultRecipe = {
                id: newId,
                name: generateUniqueRecipeName(),
                ingredients: [],
            };
            // Add new recipe to recipes list
            setRecipes(prev => [...prev, JSON.parse(JSON.stringify(defaultRecipe))]);
        }
        const newSize: MenuItemSize = { name, price: 0, recipe: defaultRecipe };
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
    const handleAddRecipe = () => {
        const newId = generateUniqueRecipeId();
        const newRecipe: Recipe = {
            id: newId,
            name: generateUniqueRecipeName(),
            ingredients: [],
        };
        setRecipes(prev => [...prev, newRecipe]);
    };

    const handleRemoveRecipe = (recipeId: string) => {
        // Check if recipe is used by any size
        const isUsed = formState.sizes.some(s => s.recipe.id === recipeId);
        if (isUsed) {
            notify({
                tone: 'warning',
                title: 'Không thể xoá công thức',
                description: 'Công thức đang được sử dụng bởi ít nhất một size.',
            });
            return;
        }
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
        if (selectedRecipeForIngredients === recipeId) {
            setSelectedRecipeForIngredients(null);
        }
    };

    const handleRecipeNameChange = (recipeId: string, name: string) => {
        setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, name } : r));
        // Also update in sizes if used
        const newSizes = formState.sizes.map(s =>
            s.recipe.id === recipeId ? { ...s, recipe: { ...s.recipe, name } } : s
        );
        setFormState(prev => ({ ...prev, sizes: newSizes }));
    };

    const handleSelectRecipeForSize = (sizeIndex: number, recipeId: string) => {
        const selectedRecipe = recipes.find(r => r.id === recipeId);
        if (selectedRecipe) {
            const newSizes = [...formState.sizes];
            newSizes[sizeIndex].recipe = JSON.parse(JSON.stringify(selectedRecipe)); // Deep copy
            setFormState(prev => ({ ...prev, sizes: newSizes }));
        }
    };

    const handleAddIngredientToRecipe = (recipeId: string) => {
        if (ingredients.length > 0) {
            // Check if ingredient already exists in recipe
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                const availableIngredients = ingredients.filter(ing =>
                    !recipe.ingredients.some(ri => ri.ingredient.id === ing.id)
                );
                if (availableIngredients.length === 0) {
                    notify({
                        tone: 'info',
                        title: 'Đã đủ nguyên liệu',
                        description: 'Tất cả nguyên liệu khả dụng đã có trong công thức này.',
                    });
                    return;
                }
                const newIngredient: RecipeIngredient = { ingredient: availableIngredients[0], quantity: 0 };
                setRecipes(prev => prev.map(r =>
                    r.id === recipeId ? { ...r, ingredients: [...r.ingredients, newIngredient] } : r
                ));
                // Also update in sizes if used
                const newSizes = formState.sizes.map(s =>
                    s.recipe.id === recipeId ? { ...s, recipe: { ...s.recipe, ingredients: [...s.recipe.ingredients, newIngredient] } } : s
                );
                setFormState(prev => ({ ...prev, sizes: newSizes }));
            }
        }
    };

    const handleRemoveIngredientFromRecipe = (recipeId: string, ingredientIndex: number) => {
        setRecipes(prev => prev.map(r =>
            r.id === recipeId ? { ...r, ingredients: r.ingredients.filter((_, i) => i !== ingredientIndex) } : r
        ));
        // Also update in sizes if used
        const newSizes = formState.sizes.map(s =>
            s.recipe.id === recipeId ? { ...s, recipe: { ...s.recipe, ingredients: s.recipe.ingredients.filter((_, i) => i !== ingredientIndex) } } : s
        );
        setFormState(prev => ({ ...prev, sizes: newSizes }));
    };

    const handleIngredientChangeInRecipe = (recipeId: string, ingredientIndex: number, field: 'ingredient' | 'quantity', value: string | number) => {
        setRecipes(prev => prev.map(r => {
            if (r.id === recipeId) {
                const newIngredients = r.ingredients.map((item, idx) => {
                    if (idx === ingredientIndex) {
                        if (field === 'ingredient') {
                            const selectedIngredient = ingredients.find(ing => ing.id === value);
                            if (selectedIngredient) {
                                return { ...item, ingredient: selectedIngredient };
                            }
                        } else {
                            return { ...item, quantity: Number(value) };
                        }
                    }
                    return item;
                });
                return { ...r, ingredients: newIngredients };
            }
            return r;
        }));
        // Also update in sizes if used
        setFormState(prev => ({
            ...prev,
            sizes: prev.sizes.map(s => {
                if (s.recipe.id === recipeId) {
                    const newIngredients = s.recipe.ingredients.map((item, idx) => {
                        if (idx === ingredientIndex) {
                            if (field === 'ingredient') {
                                const selectedIngredient = ingredients.find(ing => ing.id === value);
                                if (selectedIngredient) {
                                    return { ...item, ingredient: selectedIngredient };
                                }
                            } else {
                                return { ...item, quantity: Number(value) };
                            }
                        }
                        return item;
                    });
                    return { ...s, recipe: { ...s.recipe, ingredients: newIngredients } };
                }
                return s;
            })
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, description, category, imageUrls, inStock, sizes } = formState;

        if (!name || sizes.length === 0 || imageUrls.length === 0) {
            notify({
                tone: 'error',
                title: 'Thiếu thông tin món ăn',
                description: 'Vui lòng nhập tên món, thêm ít nhất một hình ảnh và một size.',
            });
            return;
        }

        const menuItemData = { name, description, category, imageUrls, inStock, sizes };
        if (itemToEdit) {
            updateMenuItem({ ...menuItemData, id: itemToEdit.id });
            notify({
                tone: 'success',
                title: 'Đã cập nhật món',
                description: `${name} đã được lưu thành công.`,
            });
        } else {
            addMenuItem(menuItemData);
            notify({
                tone: 'success',
                title: 'Đã thêm món mới',
                description: `${name} đã được thêm vào thực đơn.`,
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-hidden">
            <div className="bg-white shadow-2xl w-full h-screen max-h-screen flex flex-col overflow-hidden">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900">{itemToEdit ? 'Chỉnh sửa Món' : 'Thêm Món Mới'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <XIcon className="w-7 h-7" />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 bg-gray-50 scrollbar-hide min-h-0">
                    <div className="grid grid-cols-2 gap-6 h-full min-h-0">
                        {/* Cột trái: Thông tin cơ bản */}
                        <div className="space-y-3 pr-4 overflow-hidden flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex-shrink-0">Thông tin cơ bản</h3>

                            <div className="flex-1 flex flex-col space-y-3 min-h-0">
                                {itemToEdit && (
                                    <div className="flex-shrink-0">
                                        <label htmlFor="itemId" className="block text-sm font-medium text-gray-700">Mã món</label>
                                        <input type="text" id="itemId" name="itemId" value={itemToEdit.id} readOnly className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500 cursor-not-allowed focus:outline-none focus:ring-0" />
                                    </div>
                                )}

                                <div className="flex-shrink-0 grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên món</label>
                                        <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} required className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục</label>
                                        <select id="category" name="category" value={formState.category} onChange={handleInputChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                            {CATEGORIES.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
                                    <textarea id="description" name="description" value={formState.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
                                </div>

                                <div className="flex items-center flex-shrink-0">
                                    <input id="inStock" name="inStock" type="checkbox" checked={formState.inStock} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500" />
                                    <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">Còn hàng</label>
                                </div>

                                {/* Image Upload */}
                                <div className="border-t border-gray-200 pt-3 flex-shrink-0">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                                    <div className="flex flex-wrap gap-2">
                                        {formState.imageUrls.map((url, index) => (
                                            <div key={index} className="relative">
                                                <img src={url} alt={`Preview ${index}`} className="w-20 h-20 rounded-md object-cover border border-gray-200" />
                                                <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-lg transition-transform hover:scale-110">
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <label htmlFor="image-upload" className="cursor-pointer w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-indigo-500 hover:bg-gray-50 transition">
                                            <div className="text-center">
                                                <PlusIcon className="mx-auto h-6 w-6 text-gray-400" />
                                                <span className="mt-1 block text-xs font-medium text-gray-500">Tải lên</span>
                                            </div>
                                        </label>
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
                            </div>
                        </div>

                        {/* Cột phải: Sizes & Công thức */}
                        <div className="space-y-4 overflow-y-auto pl-4 border-l border-gray-200 scrollbar-hide min-h-0">
                            {/* Phần quản lý công thức */}
                            <div className="mb-4 pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Công thức</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddRecipe}
                                        className="flex items-center gap-1 text-sm py-1 px-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Thêm công thức
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                                    {recipes.map((recipe, index) => (
                                        <div key={`${recipe.id}-${index}`} className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <input
                                                    type="text"
                                                    value={recipe.name}
                                                    onChange={e => handleRecipeNameChange(recipe.id, e.target.value)}
                                                    className="flex-1 bg-white border-gray-300 rounded-md py-1 px-2 text-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Tên công thức"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRecipe(recipe.id)}
                                                    className="ml-2 text-red-600 hover:text-red-700"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Mã: {recipe.id}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRecipeForIngredients(selectedRecipeForIngredients === recipe.id ? null : recipe.id)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700"
                                                >
                                                    {selectedRecipeForIngredients === recipe.id ? 'Ẩn' : 'Thiết lập'} nguyên liệu
                                                </button>
                                            </div>
                                            {selectedRecipeForIngredients === recipe.id && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-xs font-medium text-gray-700">
                                                            Nguyên liệu ({recipe.ingredients.length})
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddIngredientToRecipe(recipe.id)}
                                                            className="flex items-center gap-1 text-xs py-1 px-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition"
                                                        >
                                                            <PlusIcon className="w-3 h-3" /> Thêm nguyên liệu
                                                        </button>
                                                    </div>
                                                    {recipe.ingredients.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {recipe.ingredients.map((recipeItem, rIndex) => (
                                                                <div key={`${recipe.id}-${rIndex}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                    <select
                                                                        value={recipeItem.ingredient.id}
                                                                        onChange={e => handleIngredientChangeInRecipe(recipe.id, rIndex, 'ingredient', e.target.value)}
                                                                        className="flex-grow bg-white border-gray-300 rounded-md py-1.5 px-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                    >
                                                                        {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveIngredientFromRecipe(recipe.id, rIndex)}
                                                                        className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                                                                        title="Xóa nguyên liệu"
                                                                    >
                                                                        <XIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded border border-gray-200">
                                                            Chưa có nguyên liệu. Nhấn "Thêm nguyên liệu" để thêm.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {recipes.length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-4">Chưa có công thức nào. Hãy thêm công thức trước.</p>
                                    )}
                                </div>
                            </div>

                            {/* Phần quản lý Sizes */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Sizes</h3>
                                    <div className="relative" ref={sizeDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsSizeDropdownOpen(prev => !prev)}
                                            className="flex items-center gap-1 text-sm py-1 px-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition"
                                        >
                                            <PlusIcon className="w-4 h-4" /> Thêm Size
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isSizeDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                                <div className="py-1">
                                                    {PREDEFINED_SIZES.map(sizeName => (
                                                        <button
                                                            key={sizeName}
                                                            type="button"
                                                            onClick={() => handleAddSize(sizeName)}
                                                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                                                        >
                                                            {sizeName}
                                                        </button>
                                                    ))}
                                                    <div className="border-t border-gray-300 my-1"></div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddSize()}
                                                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                                                    >
                                                        Size tùy chỉnh
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {formState.sizes.map((size, sIndex) => (
                                <div key={sIndex} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700">Tên Size</label>
                                                    <input type="text" placeholder="VD: Large" value={size.name} onChange={e => handleSizeChange(sIndex, 'name', e.target.value)} required className="mt-1 block w-full bg-white border-gray-300 rounded-md py-1 px-2 text-sm text-gray-900" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700">Giá</label>
                                                    <input type="number" placeholder="12.50" value={size.price} onChange={e => handleSizeChange(sIndex, 'price', parseFloat(e.target.value))} required min="0" step="0.01" className="mt-1 block w-full bg-white border-gray-300 rounded-md py-1 px-2 text-sm text-gray-900" />
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveSize(sIndex)} className="text-red-600 hover:text-red-700 mt-1"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <label className="block text-xs font-medium text-gray-700 mb-2">Chọn công thức</label>
                                        {recipes.length > 0 ? (
                                            <select
                                                value={size.recipe.id}
                                                onChange={e => handleSelectRecipeForSize(sIndex, e.target.value)}
                                                className="w-full bg-white border-gray-300 rounded-md py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                {recipes.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-xs text-gray-500 py-2">Vui lòng thêm công thức trước.</p>
                                        )}
                                        <div className="mt-2 text-xs text-gray-500 mb-3">
                                            Công thức: {size.recipe.name || 'Chưa chọn'} ({size.recipe.ingredients.length} nguyên liệu)
                                        </div>
                                        {size.recipe.ingredients.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <h4 className="text-xs font-medium text-gray-700 mb-2">Số lượng nguyên liệu cho size này</h4>
                                                <div className="space-y-2">
                                                    {size.recipe.ingredients.map((recipeItem, rIndex) => (
                                                        <div key={`${sIndex}-${rIndex}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                            <div className="flex-1 text-xs text-gray-700">
                                                                {recipeItem.ingredient.name} ({recipeItem.ingredient.unit})
                                                            </div>
                                                            <input
                                                                type="number"
                                                                placeholder="Số lượng"
                                                                value={recipeItem.quantity || ''}
                                                                onChange={e => {
                                                                    const newSizes = [...formState.sizes];
                                                                    const newIngredients = [...newSizes[sIndex].recipe.ingredients];
                                                                    newIngredients[rIndex] = { ...newIngredients[rIndex], quantity: Number(e.target.value) };
                                                                    newSizes[sIndex] = {
                                                                        ...newSizes[sIndex],
                                                                        recipe: { ...newSizes[sIndex].recipe, ingredients: newIngredients }
                                                                    };
                                                                    setFormState(prev => ({ ...prev, sizes: newSizes }));
                                                                }}
                                                                min="0"
                                                                step="any"
                                                                className="w-24 bg-white border-gray-300 rounded-md py-1.5 px-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
                <footer className="p-4 flex justify-end gap-3 border-t border-gray-200 flex-shrink-0 bg-white">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition">Hủy</button>
                    <button type="submit" onClick={handleSubmit} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition">Lưu món</button>
                </footer>
            </div>
        </div>
    );
};

export default MenuItemModal;