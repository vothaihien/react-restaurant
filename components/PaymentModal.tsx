import React, { useState } from 'react';
import type { Order } from '../types';
import { PaymentMethod } from '../types';
import { useAppContext } from '../context/AppContext';
import { XIcon } from './Icons';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose }) => {
    const { closeOrder } = useAppContext();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

    const handlePayment = () => {
        if (selectedPaymentMethod) {
            closeOrder(order.id, selectedPaymentMethod);
            onClose();
        } else {
            alert('Please select a payment method.');
        }
    };
    
    const discountAmount = order.subtotal * (order.discount / 100);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Payment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <XIcon className="w-7 h-7" />
                    </button>
                </header>
                <div className="p-6">
                    <div className="bg-gray-900 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-white border-b border-gray-700 pb-2">Bill Summary</h3>
                        <div className="space-y-2 text-gray-300">
                            {order.items.map(item => (
                                <div key={`${item.menuItem.id}-${item.size}`} className="flex justify-between">
                                    <span>{item.quantity}x {item.menuItem.name} <span className="text-gray-400 text-sm">({item.size})</span></span>
                                    <span>${(item.menuItem.sizes.find(s => s.name === item.size)!.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700 space-y-2 text-lg">
                             <div className="flex justify-between font-semibold">
                                <span>Subtotal</span>
                                <span>${order.subtotal.toFixed(2)}</span>
                            </div>
                             {order.discount > 0 && (
                                 <div className="flex justify-between text-yellow-400">
                                     <span>Discount ({order.discount}%)</span>
                                     <span>-${discountAmount.toFixed(2)}</span>
                                 </div>
                             )}
                            <div className="flex justify-between font-bold text-2xl text-white pt-2">
                                <span>Total</span>
                                <span>${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-white">Select Payment Method</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {(Object.values(PaymentMethod) as PaymentMethod[]).map(method => (
                                <button 
                                    key={method} 
                                    onClick={() => setSelectedPaymentMethod(method)}
                                    className={`p-4 rounded-lg font-semibold transition ${selectedPaymentMethod === method ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <button 
                            onClick={handlePayment} 
                            disabled={!selectedPaymentMethod}
                            className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-500 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
