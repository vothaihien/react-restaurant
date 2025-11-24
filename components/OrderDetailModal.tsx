import React, { useEffect, useState, useRef } from 'react';
import { orderService } from '@/services/orderService';
import { formatVND } from '@/shared/utils';
import { XIcon, PrinterIcon, CheckCircleIcon } from '@/components/Icons'; 
import { useFeedback } from '@/core/context/FeedbackContext';
import { useReactToPrint } from 'react-to-print'; // npm install react-to-print

interface OrderDetailModalProps {
    maDonHang: string;
    onClose: () => void;
    onPaymentSuccess: () => void; 
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ maDonHang, onClose, onPaymentSuccess }) => {
    const [orderData, setOrderData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { notify } = useFeedback();
    
    const componentRef = useRef<HTMLDivElement>(null);

    // Hàm in (Lấy nội dung trong thẻ ref để in)
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `HoaDon_${maDonHang}`,
    });

    // 1. Tải chi tiết đơn hàng
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await orderService.getOrderDetail(maDonHang);
                setOrderData(data);
            } catch (error) {
                console.error(error);
                notify({ tone: 'error', title: 'Lỗi', description: 'Không tải được chi tiết đơn.' });
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [maDonHang]);

    // 2. Xử lý Thanh toán
    const handlePayment = async () => {
        if (!window.confirm("Xác nhận thanh toán và trả bàn?")) return;

        try {
            // GỌI API CŨ CỦA BẠN: Chuyển trạng thái sang "DA_HOAN_THANH"
            // Server sẽ tự động chuyển bàn về Trống và set giờ kết thúc
            await orderService.updateOrderStatus(maDonHang, "DA_HOAN_THANH");
            
            notify({ tone: 'success', title: 'Thành công', description: 'Thanh toán thành công!' });
            
            // Tự động bật hộp thoại in sau khi thanh toán xong
            handlePrint();

            // Đóng modal và reload lại dashboard
            onPaymentSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            notify({ tone: 'error', title: 'Lỗi', description: 'Thanh toán thất bại.' });
        }
    };

    if (loading) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-white">Đang tải...</div>;
    if (!orderData) return null;

    // 3. Gom nhóm món ăn theo Bàn (để in cho đẹp)
    const itemsByTable: Record<string, any[]> = {};
    if (orderData.monAns) {
        orderData.monAns.forEach((item: any) => {
            const tableName = item.tenBan || "Chung";
            if (!itemsByTable[tableName]) itemsByTable[tableName] = [];
            itemsByTable[tableName].push(item);
        });
    }

    // Tính tổng tiền
    const grandTotal = orderData.monAns?.reduce((sum: number, item: any) => sum + (item.donGia * item.soLuong), 0) || 0;
    const customerPay = grandTotal - (orderData.tienDatCoc || 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-800">Thanh toán đơn: {maDonHang}</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-gray-500 hover:text-red-500" /></button>
                </div>

                {/* NỘI DUNG HÓA ĐƠN (Sẽ được in) */}
                <div className="p-8 overflow-y-auto flex-1 bg-white" ref={componentRef}>
                    <div className="text-center mb-8 border-b-2 border-dashed border-gray-300 pb-4">
                        <h1 className="text-3xl font-bold uppercase tracking-wider">Hóa Đơn Tính Tiền</h1>
                        <p className="text-gray-500 mt-1">{new Date().toLocaleString('vi-VN')}</p>
                        <p className="text-sm text-gray-400">Mã đơn: {maDonHang}</p>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-y-2 text-sm">
                        <div><strong>Khách hàng:</strong> {orderData.tenNguoiDat}</div>
                        <div><strong>SĐT:</strong> {orderData.sdtNguoiDat || '---'}</div>
                        <div><strong>Thu ngân:</strong> {orderData.tenNhanVien || 'Admin'}</div>
                        <div><strong>Giờ vào:</strong> {new Date(orderData.thoiGianNhanBan).toLocaleTimeString('vi-VN')}</div>
                    </div>

                    <div className="space-y-6">
    {Object.entries(itemsByTable).map(([tableName, items]) => {
        
        // 1. LOGIC GỘP MÓN MỚI THÊM VÀO ĐÂY
        // Gom các món trùng tên + trùng size lại với nhau
        const groupedItems: any[] = [];
        items.forEach((item: any) => {
            const existingItem = groupedItems.find(g => 
                g.tenMon === item.tenMon && 
                g.tenPhienBan === item.tenPhienBan
            );

            if (existingItem) {
                existingItem.soLuong += item.soLuong;
            } else {
                // Copy object để tránh sửa vào mảng gốc (quan trọng!)
                groupedItems.push({ ...item }); 
            }
        });

        // Tính tổng tiền riêng của bàn này (Dựa trên danh sách ĐÃ GỘP)
        const tableTotal = groupedItems.reduce((sum, i) => sum + (i.donGia * i.soLuong), 0);

        return (
            <div key={tableName} className="border rounded-lg p-3">
                <div className="bg-gray-100 p-2 font-bold text-gray-700 flex justify-between">
                    <span>{tableName}</span>
                    <span>Tổng: {formatVND(tableTotal)}</span>
                </div>
                <table className="w-full mt-2 text-sm">
                    <thead>
                        <tr className="text-left text-gray-500 border-b">
                            <th className="pb-1">Món</th>
                            <th className="pb-1 text-center">SL</th>
                            <th className="pb-1 text-right">Đơn giá</th>
                            <th className="pb-1 text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 2. MAP QUA DANH SÁCH ĐÃ GỘP (groupedItems) THAY VÌ items */}
                        {groupedItems.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0">
                                <td className="py-2">
                                    {item.tenMon} <br/>
                                    <span className="text-xs text-gray-400">{item.tenPhienBan}</span>
                                </td>
                                <td className="py-2 text-center font-medium">{item.soLuong}</td>
                                <td className="py-2 text-right">{formatVND(item.donGia)}</td>
                                <td className="py-2 text-right font-medium">
                                    {formatVND(item.soLuong * item.donGia)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    })}
</div>

                    {/* Tổng kết tiền */}
                    <div className="mt-8 border-t-2 border-gray-800 pt-4 space-y-2">
                        <div className="flex justify-between text-lg">
                            <span className="font-bold">Tổng cộng:</span>
                            <span>{formatVND(grandTotal)}</span>
                        </div>
                        
                        {orderData.tienDatCoc > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Đã đặt cọc:</span>
                                <span>- {formatVND(orderData.tienDatCoc)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-dashed border-gray-300 pt-2 mt-2">
                            <span>THÀNH TIỀN:</span>
                            <span>{formatVND(customerPay)}</span>
                        </div>
                    </div>
                    
                    <div className="mt-12 text-center text-xs text-gray-400 italic">
                        <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
                        <p>Hẹn gặp lại!</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded hover:bg-blue-100 flex items-center gap-2 transition"
                    >
                        <PrinterIcon className="w-5 h-5" /> In hóa đơn
                    </button>
                    
                    <button 
                        onClick={handlePayment}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200 transition"
                    >
                        <CheckCircleIcon className="w-5 h-5" /> Thanh toán
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;