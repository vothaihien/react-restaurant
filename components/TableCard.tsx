import React from 'react';
// Import type Table (hoặc dùng any nếu bạn chưa sửa file types)
import type { Table } from '@/features/tables/domain/types';

interface TableCardProps {
    table: Table;
    onClick: () => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, onClick }) => {

    // Hàm lấy màu sắc (Đã chỉnh sửa để linh hoạt hơn)
    const getStatusStyles = () => {
        // 1. Chuyển về chuỗi và xóa khoảng trắng thừa
        // 2. Chuyển về chữ thường để so sánh không phân biệt hoa thường
        const status = String(table.status || '').trim().toLowerCase();

        // Debug: Bật F12 lên xem console nếu màu vẫn không hiện để kiểm tra giá trị thực tế
        // console.log(`DEBUG: Bàn ${table.name} - Trạng thái nhận được: "${status}"`);

        // === TRƯỜNG HỢP 1: TRỐNG (Màu Xanh) ===
        // Thêm 'đang trống' vào đây vì trong hình bạn gửi thấy có chữ này
        if (status === 'trống' || status === 'dang trong' || status === 'đang trống') {
            return 'border-green-500 bg-green-50 hover:bg-green-100 text-green-700';
        }

        // === TRƯỜNG HỢP 2: ĐANG PHỤC VỤ (Màu Đỏ) ===
        if (status === 'đang phục vụ' || status === 'dang phuc vu') {
            return 'border-red-500 bg-red-50 hover:bg-red-100 text-red-700';
        }

        // === TRƯỜNG HỢP 3: ĐÃ ĐẶT (Màu Cam/Vàng) ===
        if (status === 'đã đặt' || status === 'da dat') {
            return 'border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-800';
        }

        // === TRƯỜNG HỢP 4: BẢO TRÌ (Màu Xám) ===
        if (status === 'bảo trì' || status === 'bao tri') {
            return 'border-gray-400 bg-gray-100 cursor-not-allowed text-gray-500 opacity-80';
        }

        // Mặc định (nếu không khớp cái nào)
        return 'border-gray-300 bg-white hover:bg-gray-50 text-gray-800';
    };

    // Hàm hiển thị text trạng thái (Phòng trường hợp data null)
    const displayStatus = () => {
        return table.status ? String(table.status) : 'Không xác định';
    }
    
    // Helper xác định màu cho dấu chấm tròn (dot)
    const getDotColor = () => {
         const status = String(table.status || '').trim().toLowerCase();
         if (status === 'trống' || status === 'dang trong' || status === 'đang trống') return 'bg-green-600';
         if (status === 'đang phục vụ' || status === 'dang phuc vu') return 'bg-red-600';
         if (status === 'đã đặt' || status === 'da dat') return 'bg-orange-500';
         return 'bg-gray-500';
    }

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${getStatusStyles()}`}
        >
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">{table.name}</h3>
                <span className="text-xs font-semibold bg-white/60 px-2 py-1 rounded border border-current opacity-80">
                    {table.capacity} khách
                </span>
            </div>

            {/* Hiển thị Tầng (nếu có) */}
            {/* @ts-ignore */}
            {table.maTang && (
                <div className="text-xs mb-2 opacity-80">
                    {/* @ts-ignore */}
                    {table.maTang === 'T001' ? 'Tầng trệt' : table.maTang === 'T002' ? 'Tầng 1' : table.maTang === 'T003' ? 'Tầng 2' : table.maTang}
                </div>
            )}

            <div className="flex items-center gap-2">
                {/* Dấu chấm tròn màu */}
                <span className={`w-2.5 h-2.5 rounded-full ${getDotColor()}`}></span>

                {/* Tên trạng thái */}
                <p className="text-md font-medium">
                    {displayStatus()}
                </p>
            </div>
        </div>
    );
};

export default TableCard;