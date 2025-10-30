import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MenuItemModal from '../components/MenuItemModal';
import type { MenuItem } from '../types';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../components/Icons';

const MenuView: React.FC = () => {
    const { menuItems, deleteMenuItem } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: MenuItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDeleteItem = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            deleteMenuItem(itemId);
        }
    };
    
    const getPriceRange = (item: MenuItem): string => {
        if (!item.sizes || item.sizes.length === 0) return 'N/A';
        if (item.sizes.length === 1) return `$${item.sizes[0].price.toFixed(2)}`;
        const prices = item.sizes.map(s => s.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Menu Management</h1>
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition"
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    <span>Add New Item</span>
                </button>
            </div>

            <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Item</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                            {menuItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-12">
                                                <img className="h-12 w-12 rounded-md object-cover" src={item.imageUrls[0]} alt={item.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">{item.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-300">{item.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-white font-semibold">{getPriceRange(item)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            item.inStock ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                                        }`}>
                                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => handleOpenEditModal(item)} className="text-indigo-400 hover:text-indigo-300 transition">
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-300 transition">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <MenuItemModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                itemToEdit={editingItem}
            />
        </div>
    );
};

export default MenuView;
