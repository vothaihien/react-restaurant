import React, { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import MenuItemModal from '@/components/MenuItemModal';
import type { MenuItem } from '@/features/menu/domain/types';
import { PlusCircleIcon, EditIcon, TrashIcon } from '@/components/Icons';
import { formatVND } from '@/shared/utils';
import { useFeedback } from '@/core/context/FeedbackContext';
import { Api, BASE_URL } from '@/shared/utils/api';
import { Pagination } from '@/components/ui/pagination';

const MenuView: React.FC = () => {
    const { menuItems, categories, deleteMenuItem } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const { notify, confirm } = useFeedback();
    const [remoteItems, setRemoteItems] = useState<MenuItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const params = selectedCategory ? { maDanhMuc: selectedCategory } : undefined;
                const data = await Api.getDishes(params);
                const mapped: MenuItem[] = (data || []).map((m: any) => {
                    const imgs: string[] = (m.hinhAnhMonAns || m.HinhAnhMonAns || []).map((h: any) => {
                        const url = h.urlHinhAnh || h.URLHinhAnh;
                        return url?.startsWith('http') ? url : `${BASE_URL}/${url}`;
                    });
                    const tenDanhMuc = m.maDanhMucNavigation?.tenDanhMuc || m.MaDanhMucNavigation?.TenDanhMuc || '';
                    const sizes = (m.phienBanMonAns || m.PhienBanMonAns || []).map((p: any) => ({
                        name: p.tenPhienBan || p.TenPhienBan,
                        price: Number(p.gia || p.Gia) || 0,
                        recipe: { id: '', name: '', ingredients: [] }
                    }));
                    return {
                        id: m.maMonAn || m.MaMonAn,
                        name: m.tenMonAn || m.TenMonAn,
                        description: '',
                        categoryId: m.maDanhMuc || m.MaDanhMuc,
                        category: tenDanhMuc,
                        imageUrls: imgs,
                        inStock: true,
                        sizes
                    } as MenuItem;
                });
                setRemoteItems(mapped);
            } catch (e: any) {
                setRemoteItems(null);
                notify({
                    tone: 'warning',
                    title: 'Không thể tải món ăn từ server',
                    description: e?.message || 'Đang sử dụng dữ liệu mẫu'
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [notify, selectedCategory]);

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

    const filteredItems = useMemo(() => {
        const items = (remoteItems ?? menuItems);
        if (!selectedCategory) return items;
        const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name?.toLowerCase()?.trim();
        return items.filter(item => {
            if (item.categoryId) {
                return item.categoryId === selectedCategory;
            }
            if (selectedCategoryName) {
                return item.category?.toLowerCase()?.trim() === selectedCategoryName;
            }
            return false;
        });
    }, [remoteItems, menuItems, selectedCategory, categories]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredItems.slice(startIndex, endIndex);
    }, [filteredItems, currentPage, itemsPerPage]);

    // Reset về trang 1 khi dữ liệu thay đổi
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

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

            {loading && (
                <div className="mb-4 text-gray-600">Đang tải dữ liệu từ server...</div>
            )}

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-700">Hiển thị:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={5}>5 món</option>
                            <option value={10}>10 món</option>
                            <option value={20}>20 món</option>
                            <option value={50}>50 món</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-600">
                        Tổng: <span className="font-semibold">{filteredItems.length}</span> món
                    </div>
                </div>
                <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex flex-wrap gap-3 items-center">
                        <span className="text-sm text-gray-700 font-medium">Danh mục:</span>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedCategory('');
                                setCurrentPage(1);
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium border transition ${selectedCategory === ''
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                                }`}
                        >
                            Tất cả
                        </button>
                        {(categories.length > 0 ? categories : []).map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    setSelectedCategory(prev => {
                                        const next = prev === cat.id ? '' : cat.id;
                                        if (next !== prev) {
                                            setCurrentPage(1);
                                        }
                                        return next;
                                    });
                                }}
                                className={`px-3 py-1 rounded-full text-sm font-medium border transition ${selectedCategory === cat.id
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
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
                            {paginatedItems.length > 0 ? (
                                paginatedItems.map((item) => (
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        Không có món nào trong thực đơn
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredItems.length}
                    />
                )}
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
