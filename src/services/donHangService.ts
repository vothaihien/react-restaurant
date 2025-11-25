// src/services/donHangService.ts
import axiosClient from '@/api/axiosClient'; // Đảm bảo đường dẫn import đúng

// Interface này dùng cho component DatBanView mới
export interface DonHangActive {
    maDonHang: string;
    tenNguoiNhan: string;
    soNguoi: number;
    thoiGianNhanBan: string; // ISO string
    trangThai: string;
    maTrangThai: string;
    banAn: string[]; // List tên bàn
}

export const donHangService = {
    // 1. Lấy danh sách đơn hàng active theo ngày
    getActiveBookings: async (ngay: string) => {
        // Axios tự động chuyển object params thành ?ngay=...
        // Lưu ý: Đã bỏ '/api' ở đầu path vì baseURL đã có sẵn
        const rawResponse = await axiosClient.get('/DonHangsAPI/GetActiveBookings', {
            params: { ngay }
        });
        
        // Ép kiểu Double Casting để tránh lỗi TypeScript
        return rawResponse as unknown as DonHangActive[];
    },

    // 2. Lấy chi tiết đơn hàng (Dùng cho cả việc click vào bàn để xem)
    getMyBookingDetail: async (params: { maDonHang?: string; maBan?: string; dateTime?: string }) => {
        // Không cần new URLSearchParams() nữa, Axios lo hết
        const rawResponse = await axiosClient.get('/DonHangsAPI/GetMyBookingDetail', {
            params: params 
        });

        // Ép kiểu (dùng any vì bạn đang để any, nếu có interface chi tiết thì thay vào)
        return rawResponse as unknown as any;
    },
    
    // 3. Lấy danh sách khách hàng cần gọi điện nhắc nhở
    getCustomersToCall: async () => {
        const rawResponse = await axiosClient.get('/DonHangsAPI/get-customers-to-call');
        
        // Ép kiểu về mảng
        return rawResponse as unknown as any[];
    },
};