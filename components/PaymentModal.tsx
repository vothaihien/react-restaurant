import React, { useState } from 'react';
import type { Order } from '@/core/types';
import { PaymentMethod } from '@/features/orders/domain/types';
import { useAppContext } from '@/core/context/AppContext';
import { useFeedback } from '@/core/context/FeedbackContext';
import { XIcon } from '@/components/Icons';
import { formatVND } from '@/shared/utils';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
}

const viPaymentLabel = (m: PaymentMethod) => {
    switch (m) {
        case PaymentMethod.Cash: return 'Tiền mặt';
        case PaymentMethod.Card: return 'Thẻ';
        case PaymentMethod.Transfer: return 'Chuyển khoản';
        default: return String(m);
    }
};

const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose }) => {
    const { closeOrder } = useAppContext();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const { notify } = useFeedback();

    const handlePayment = () => {
        if (selectedPaymentMethod) {
            closeOrder(order.id, selectedPaymentMethod);
            notify({
                tone: 'success',
                title: 'Thanh toán thành công',
                description: `Đơn hàng của bàn ${order.tableId} đã được thanh toán bằng ${viPaymentLabel(selectedPaymentMethod)}.`,
            });
            onClose();
        } else {
            notify({
                tone: 'warning',
                title: 'Chưa chọn phương thức',
                description: 'Vui lòng chọn một phương thức thanh toán trước khi xác nhận.',
            });
        }
    };

    const discountAmount = order.subtotal * (order.discount / 100);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Thanh toán</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition">
                        <XIcon className="w-7 h-7" />
                    </button>
                </header>
                <div className="p-6">
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b border-gray-200 pb-2">Tóm tắt hóa đơn</h3>
                        <div className="space-y-2 text-gray-700">
                            {order.items.map(item => (
                                <div key={`${item.menuItem.id}-${item.size}`} className="flex justify-between">
                                    <span>{item.quantity}x {item.menuItem.name} <span className="text-gray-500 text-sm">({item.size})</span></span>
                                    <span>{formatVND(item.menuItem.sizes.find(s => s.name === item.size)!.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-lg">
                            <div className="flex justify-between font-semibold">
                                <span>Tạm tính</span>
                                <span>{formatVND(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-yellow-600">
                                    <span>Giảm giá ({order.discount}%)</span>
                                    <span>-{formatVND(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-2xl text-gray-900 pt-2">
                                <span>Tổng cộng</span>
                                <span>{formatVND(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-900">Chọn phương thức thanh toán</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {(Object.values(PaymentMethod) as PaymentMethod[]).map(method => (
                                <button
                                    key={method}
                                    onClick={() => setSelectedPaymentMethod(method)}
                                    className={`p-4 rounded-lg font-semibold transition ${selectedPaymentMethod === method ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                >
                                    {viPaymentLabel(method)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={handlePayment}
                            disabled={!selectedPaymentMethod}
                            className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-500 transition disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            Xác nhận thanh toán
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
