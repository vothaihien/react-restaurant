import React, { useState, useEffect } from 'react';
import type { Table, Order, MenuItem, OrderItem, MenuItemSize } from '../types';
import { useAppContext } from '../context/AppContext';
import { XIcon, TrashIcon } from './Icons';
import MenuItemCard from './MenuItemCard';
import { CATEGORIES } from '../constants';

interface OrderModalProps {
    table: Table;
    order?: Order;
    onClose: () => void;
    onOpenPayment: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ table, order, onClose, onOpenPayment }) => {
    const { menuItems, createOrder, updateOrder } = useAppContext();
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

    const handleSaveOrder = () => {
        if (order) {
            updateOrder(order.id, currentOrderItems);
        } else {
            createOrder(table.id, currentOrderItems);
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
        : menuItems.filter(item => item.category === selectedCategory);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Order for {table.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <XIcon className="w-8 h-8" />
                    </button>
                </header>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Left side: Menu */}
                    <div className="w-3/5 p-4 overflow-y-auto border-r border-gray-700">
                        <div className="mb-4">
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategory === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>All</button>
                                {CATEGORIES.map(cat => (
                                    <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategory === cat.name ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{cat.name}</button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredMenuItems.map(item => (
                                <MenuItemCard key={item.id} item={item} onSelect={(size) => addToOrder(item, size)} />
                            ))}
                        </div>
                    </div>

                    {/* Right side: Current Order */}
                    <div className="w-2/5 p-4 flex flex-col">
                        <h3 className="text-xl font-semibold mb-4 text-white">Current Order</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {currentOrderItems.length === 0 ? (
                                <p className="text-gray-400 text-center mt-8">No items added yet.</p>
                            ) : (
                                currentOrderItems.map(item => (
                                    <div key={`${item.menuItem.id}-${item.size}`} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-white">{item.menuItem.name} <span className="text-gray-300 text-sm">({item.size})</span></p>
                                            <p className="text-sm text-gray-300">${item.menuItem.sizes.find(s => s.name === item.size)?.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                              type="number" 
                                              value={item.quantity}
                                              onChange={(e) => updateQuantity(item.menuItem.id, item.size, parseInt(e.target.value) || 1)}
                                              className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600"
                                            />
                                            <button onClick={() => removeFromOrder(item.menuItem.id, item.size)} className="text-red-400 hover:text-red-300">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4 border-t border-gray-700 pt-4">
                            <div className="flex justify-between items-center text-xl font-bold text-white">
                                <span>Subtotal:</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <button 
                                  onClick={handleSaveOrder} 
                                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition disabled:bg-gray-500"
                                  disabled={currentOrderItems.length === 0}
                                >
                                    {order ? 'Update Order' : 'Confirm Order'}
                                </button>
                                <button
                                  onClick={onOpenPayment}
                                  className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition disabled:bg-gray-500"
                                  disabled={!order}
                                >
                                    Proceed to Payment
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
