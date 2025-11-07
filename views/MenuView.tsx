import React, { useState } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import MenuItemModal from '@/components/MenuItemModal';
import type { MenuItem } from '@/features/menu/domain/types';
import { PlusCircleIcon, EditIcon, TrashIcon } from '@/shared/components/Icons';
import { formatVND } from '@/shared/utils';
import { useFeedback } from '@/core/context/FeedbackContext';

const MenuView: React.FC = () => {
    const { menuItems, deleteMenuItem } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const { notify, confirm } = useFeedback();

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

    const handleDeleteItem = async (item: MenuItem) => {
        const shouldDelete = await confirm({
            title: 'Xóa món khỏi thực đơn',
            description: `Bạn có chắc chắn muốn xóa "${item.name}" khỏi thực đơn? Thao tác này không thể hoàn tác.`,
            confirmText: 'Xóa món',
            cancelText: 'Giữ lại',
            tone: 'danger',
        });
        if (shouldDelete) {
            deleteMenuItem(item.id);
            notify({
                tone: 'success',
                title: 'Đã xóa món',
                description: `${item.name} đã được xóa khỏi thực đơn.`,
            });
        }
    };

    const getPriceRange = (item: MenuItem): string => {
        if (!item.sizes || item.sizes.length === 0) return 'N/A';
        if (item.sizes.length === 1) return formatVND(item.sizes[0].price);
        const prices = item.sizes.map(s => s.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return `${formatVND(minPrice)} - ${formatVND(maxPrice)}`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Quản lý Thực đơn</h1>
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Thêm món mới</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Món</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Danh mục</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Giá</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Trạng thái</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Thao tác</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {menuItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-12">
                                                <img className="h-12 w-12 rounded-md object-cover border border-gray-200" src={item.imageUrls[0]} alt={item.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-700">{item.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-semibold">{getPriceRange(item)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {item.inStock ? 'Còn hàng' : 'Hết hàng'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => handleOpenEditModal(item)} className="text-indigo-600 hover:text-indigo-700 transition">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDeleteItem(item)} className="text-red-600 hover:text-red-700 transition">
                                                <TrashIcon className="w-5 h-5" />
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
