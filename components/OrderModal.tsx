import React, { useState, useEffect } from 'react';
import type { Table } from '@/features/tables/domain/types';
import type { Order, OrderItem } from '@/features/orders/domain/types';
import type { MenuItem, MenuItemSize } from '@/features/menu/domain/types';
import { useAppContext } from '@/core/context/AppContext';
import { XIcon, TrashIcon } from '@/components/Icons';
import MenuItemCard from './MenuItemCard';
import { CATEGORIES } from '@/features/menu/domain/constants';
import { formatVND } from '@/shared/utils';

interface OrderModalProps {
    table: Table;
    order?: Order;
    onClose: () => void;
    onOpenPayment: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ table, order, onClose, onOpenPayment }) => {
    const { menuItems, createOrder, updateOrder, sendOrderToKDS, getOrderForTable } = useAppContext() as any;
    const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]?.name || 'All');

    useEffect(() => {
        if (order) {
            setCurrentOrderItems(order.items);
        }
    }, [order]);

    const addToOrder = (menuItem: MenuItem, size: MenuItemSize) => {
        const existingItem = currentOrderItems.find(item => item.menuItem.id === menuItem.id && item.size === size.name);
        if (existingItem) {
            setCurrentOrderItems(currentOrderItems.map(item =>
                (item.menuItem.id === menuItem.id && item.size === size.name) ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCurrentOrderItems([...currentOrderItems, { menuItem, quantity: 1, notes: '', size: size.name }]);
        }
    };

    const removeFromOrder = (menuItemId: string, size: string) => {
        setCurrentOrderItems(currentOrderItems.filter(item => !(item.menuItem.id === menuItemId && item.size === size)));
    };

    const updateQuantity = (menuItemId: string, size: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromOrder(menuItemId, size);
        } else {
            setCurrentOrderItems(currentOrderItems.map(item =>
                (item.menuItem.id === menuItemId && item.size === size) ? { ...item, quantity } : item
            ));
        }
    };

    const updateNotes = (menuItemId: string, size: string, notes: string) => {
        setCurrentOrderItems(currentOrderItems.map(item =>
            (item.menuItem.id === menuItemId && item.size === size) ? { ...item, notes } : item
        ));
    };

    const handleSaveOrder = () => {
        if (order) {
            updateOrder(order.id, currentOrderItems);
        } else {
            createOrder(table.id, currentOrderItems);
        }
        onClose();
    };

    const handleSendToKitchen = () => {
        let current = order;
        if (!current) {
            createOrder(table.id, currentOrderItems);
            current = getOrderForTable(table.id);
        } else {
            updateOrder(order.id, currentOrderItems);
        }
        if (current) {
            sendOrderToKDS(current.id);
        }
        onClose();
    };

    const subtotal = currentOrderItems.reduce((acc, item) => {
        const size = item.menuItem.sizes.find(s => s.name === item.size);
        const price = size ? size.price : 0;
        return acc + price * item.quantity;
    }, 0);

    const filteredMenuItems = selectedCategory === 'All'
        ? menuItems
        : menuItems.filter((item: MenuItem) => item.category === selectedCategory);

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
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategory === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Tất cả</button>
                                {CATEGORIES.map(cat => (
                                    <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategory === cat.name ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{cat.name}</button>
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
                                currentOrderItems.map(item => (
                                    <div key={`${item.menuItem.id}-${item.size}`} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.menuItem.name} <span className="text-gray-500 text-sm">({item.size})</span></p>
                                                <p className="text-sm text-gray-700">{formatVND(item.menuItem.sizes.find(s => s.name === item.size)?.price || 0)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.menuItem.id, item.size, parseInt(e.target.value) || 1)}
                                                    className="w-16 bg-white text-gray-900 text-center rounded border border-gray-300"
                                                />
                                                <button onClick={() => removeFromOrder(item.menuItem.id, item.size)} className="text-red-500 hover:text-red-600">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <input
                                                value={item.notes}
                                                onChange={(e) => updateNotes(item.menuItem.id, item.size, e.target.value)}
                                                placeholder="Ghi chú bếp/bar"
                                                className="w-full bg-white text-gray-900 rounded border border-gray-300 px-3 py-2 text-sm"
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
                            <div className="mt-6 grid grid-cols-3 gap-3">
                                <button
                                    onClick={handleSaveOrder}
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition disabled:bg-gray-300 disabled:text-gray-500"
                                    disabled={currentOrderItems.length === 0}
                                >
                                    {order ? 'Cập nhật đơn' : 'Xác nhận đơn'}
                                </button>
                                <button
                                    onClick={handleSendToKitchen}
                                    className="w-full py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-400 transition disabled:bg-gray-300 disabled:text-gray-500"
                                    disabled={currentOrderItems.length === 0}
                                >
                                    Gửi bếp
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
