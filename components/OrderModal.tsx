import React, { useState, useEffect, useMemo } from 'react';
import type { Table } from '@/features/tables/domain/types';
import type { Order, OrderItem } from '@/features/orders/domain/types';
import type { MenuItem, MenuItemSize } from '@/features/menu/domain/types';
import { useAppContext } from '@/core/context/AppContext';
import { XIcon, TrashIcon } from '@/components/Icons';
import MenuItemCard from './MenuItemCard';
import { formatVND } from '@/shared/utils';
import { orderService } from '@/services/orderService';
import { useFeedback } from '@/core/context/FeedbackContext';

// Mở rộng kiểu OrderItem để có thêm cờ đánh dấu
interface ExtendedOrderItem extends OrderItem {
    isConfirmed: boolean; // true = Đã lưu DB (Khóa), false = Mới thêm (Cho sửa)
}

interface OrderModalProps {
    table: Table;
    order?: Order;
    onClose: () => void;
    onOpenPayment: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ table, order, onClose, onOpenPayment }) => {
    const { menuItems, categories, addItemsToTableOrder } = useAppContext() as any;
    const { notify } = useFeedback();

    const [currentOrderItems, setCurrentOrderItems] = useState<ExtendedOrderItem[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

   useEffect(() => {
        const loadOrderDetails = async () => {
            if (order && order.id) {
                try {
                    const data = await orderService.getOrderDetail(order.id);
                    
                    if (data && data.monAns) {
                        // Lọc chỉ lấy món của bàn hiện tại
                        const itemsOfThisTable = data.monAns.filter((m: any) => {
                            return m.maBan === table.id || m.tenBan === table.name;
                        });

                        // Map dữ liệu từ API sang định dạng Frontend
                        const rawItems: ExtendedOrderItem[] = itemsOfThisTable.map((m: any) => {
                            const originalItem = menuItems.find((mi: MenuItem) => mi.name === m.tenMon);
                            return {
                                menuItem: {
                                    id: originalItem?.id || 'unknown',
                                    name: m.tenMon,
                                    price: m.donGia,
                                    sizes: originalItem?.sizes || [],
                                    imageUrls: [m.hinhAnh],
                                    categoryId: originalItem?.categoryId || '',
                                    category: originalItem?.category || '',
                                    description: '',
                                    inStock: true
                                },
                                quantity: m.soLuong,
                                size: m.tenPhienBan, 
                                notes: m.ghiChu || '',
                                isConfirmed: true
                            };
                        });

                        // Gộp các món trùng nhau (cùng tên, cùng size, cùng ghi chú)
                        const groupedItems: ExtendedOrderItem[] = [];
                        
                        rawItems.forEach(item => {
                            const existingItem = groupedItems.find(g => 
                                g.menuItem.name === item.menuItem.name && 
                                g.size === item.size &&
                                g.notes === item.notes
                            );

                            if (existingItem) {
                                existingItem.quantity += item.quantity;
                            } else {
                                groupedItems.push(item);
                            }
                        });

                        setCurrentOrderItems(groupedItems);
                    }
                } catch (error) {
                    console.error("Lỗi tải chi tiết món:", error);
                }
            } else {
                setCurrentOrderItems([]);
            }
        };
        loadOrderDetails();
    }, [order, menuItems, table.id, table.name]);

    // --- 2. LOGIC THÊM MÓN (CỘNG DỒN THÔNG MINH) ---
    const addToOrder = (menuItem: MenuItem, size: MenuItemSize) => {
        // Tìm xem món này đã có trong danh sách MỚI (chưa khóa) chưa?
        const existingIndex = currentOrderItems.findIndex(item => 
            item.menuItem.id === menuItem.id && 
            item.size === size.name && 
            !item.isConfirmed // Chỉ cộng dồn vào món chưa khóa
        );

        if (existingIndex !== -1) {
            // Nếu đã có trong danh sách chờ -> Cộng dồn số lượng
            const newItems = [...currentOrderItems];
            newItems[existingIndex].quantity += 1;
            setCurrentOrderItems(newItems);
        } else {
            // Nếu chưa có (hoặc món đó đã bị khóa) -> Thêm dòng mới
            setCurrentOrderItems([
                ...currentOrderItems, 
                { 
                    menuItem, 
                    quantity: 1, 
                    notes: '', 
                    size: size.name, 
                    isConfirmed: false // Đánh dấu là MỚI (Cho phép sửa/xóa)
                }
            ]);
        }
    };

    const removeFromOrder = (index: number) => {
        // Chỉ cho phép xóa món chưa khóa
        if (!currentOrderItems[index].isConfirmed) {
            const newItems = [...currentOrderItems];
            newItems.splice(index, 1);
            setCurrentOrderItems(newItems);
        }
    };

    const updateQuantity = (index: number, quantity: number) => {
        if (currentOrderItems[index].isConfirmed) return; // Chặn sửa món đã khóa

        if (quantity <= 0) {
            removeFromOrder(index);
        } else {
            const newItems = [...currentOrderItems];
            newItems[index].quantity = quantity;
            setCurrentOrderItems(newItems);
        }
    };

    const updateNotes = (index: number, notes: string) => {
        // Cho phép sửa ghi chú món mới (món cũ tùy bạn, ở đây tui chặn luôn cho an toàn)
        if (currentOrderItems[index].isConfirmed) return;

        const newItems = [...currentOrderItems];
        newItems[index].notes = notes;
        setCurrentOrderItems(newItems);
    };

    // --- 3. LOGIC LƯU (CHỈ GỬI MÓN MỚI) ---
    const handleSaveOrder = async () => {
        // Lọc ra các món MỚI (isConfirmed = false) để gửi về server
        const newItemsToSend = currentOrderItems.filter(item => !item.isConfirmed);

        if (newItemsToSend.length === 0) {
            onClose(); // Không có gì mới thì đóng luôn
            return;
        }

        try {
            await addItemsToTableOrder(table.id, newItemsToSend);
            notify({ tone: 'success', title: 'Thành công', description: `Đã thêm ${newItemsToSend.length} món vào đơn.` });
            onClose();
        } catch (error) {
            notify({ tone: 'error', title: 'Lỗi', description: 'Không thể lưu món ăn.' });
        }
    };

    const subtotal = currentOrderItems.reduce((acc, item) => {
        const size = item.menuItem.sizes.find(s => s.name === item.size);
        const price = size ? size.price : 0;
        return acc + price * item.quantity;
    }, 0);

    const filteredMenuItems = useMemo(() => {
        if (selectedCategoryId === 'ALL') return menuItems;
        return menuItems.filter((item: MenuItem) => item.categoryId === selectedCategoryId);
    }, [selectedCategoryId, menuItems]);

    // Tìm xem có món nào mới chưa lưu không (để enable nút Lưu)
    const hasNewItems = currentOrderItems.some(i => !i.isConfirmed);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Đơn cho {table.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition">
                        <XIcon className="w-8 h-8" />
                    </button>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left side: Menu */}
                    <div className="w-3/5 p-4 overflow-y-auto border-r border-gray-200">
                        <div className="mb-4">
                            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                                <button 
                                    onClick={() => setSelectedCategoryId('ALL')} 
                                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategoryId === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    Tất cả
                                </button>
                                {categories.map((cat: any) => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setSelectedCategoryId(cat.id)} 
                                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategoryId === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredMenuItems.map((item: MenuItem) => (
                                <MenuItemCard key={item.id} item={item} onSelect={(size) => addToOrder(item, size)} />
                            ))}
                        </div>
                    </div>

                    {/* Right side: Current Order */}
                    <div className="w-2/5 p-4 flex flex-col">
                        <h3 className="text-xl font-semibold mb-4 text-gray-900">Đơn hiện tại</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {currentOrderItems.length === 0 ? (
                                <p className="text-gray-500 text-center mt-8">Chưa có món.</p>
                            ) : (
                                // Dùng Index (i) làm key để tránh lỗi trùng món
                                currentOrderItems.map((item, i) => (
                                    <div 
                                        key={`${item.menuItem.id}-${item.size}-${i}`} 
                                        className={`rounded-lg p-3 border ${item.isConfirmed ? 'bg-gray-100 border-gray-200 opacity-80' : 'bg-blue-50 border-blue-200'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {item.menuItem.name} 
                                                    <span className="text-gray-500 text-sm"> ({item.size})</span>
                                                    {item.isConfirmed && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1 rounded">Đã gọi</span>}
                                                </p>
                                                <p className="text-sm text-gray-700">{formatVND(item.menuItem.sizes.find(s => s.name === item.size)?.price || 0)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Input Số lượng: Disable nếu đã khóa */}
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    disabled={item.isConfirmed} 
                                                    onChange={(e) => updateQuantity(i, parseInt(e.target.value) || 1)}
                                                    className={`w-14 text-center rounded border ${item.isConfirmed ? 'bg-gray-200 text-gray-500' : 'bg-white text-gray-900 border-blue-300'}`}
                                                />
                                                
                                                {/* Nút Xóa: Ẩn hoặc Disable nếu đã khóa */}
                                                {!item.isConfirmed && (
                                                    <button onClick={() => removeFromOrder(i)} className="text-red-500 hover:text-red-600">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Ghi chú: Disable nếu đã khóa */}
                                        <div className="mt-2">
                                            <input
                                                value={item.notes}
                                                disabled={item.isConfirmed}
                                                onChange={(e) => updateNotes(i, e.target.value)}
                                                placeholder={item.isConfirmed ? "Đã gửi bếp" : "Ghi chú bếp/bar"}
                                                className={`w-full rounded border px-3 py-1 text-sm ${item.isConfirmed ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900 border-gray-300'}`}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                                <span>Tạm tính:</span>
                                <span>{formatVND(subtotal)}</span>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                {/* Nút Xác Nhận: Chỉ hiện khi có món MỚI */}
                                <button
                                    onClick={handleSaveOrder}
                                    className={`w-full py-3 font-bold rounded-lg transition ${hasNewItems ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                    disabled={!hasNewItems}
                                >
                                    {order ? 'Lưu món mới' : 'Xác nhận đơn'}
                                </button>
                                
                                <button
                                    onClick={onOpenPayment}
                                    className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition disabled:bg-gray-300 disabled:text-gray-500"
                                    disabled={!order}
                                >
                                    Thanh toán
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderModal;