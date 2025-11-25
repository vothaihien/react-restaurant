// src/services/orderService.ts
import axiosClient from '@/api/axiosClient'; // Đảm bảo đường dẫn đúng

export interface AddItemsToTablePayload {
    maDonHang: string;
    maBan: string;
    items: {
        maMonAn: string;
        maPhienBan: string; // ID của Size (ví dụ: PB001)
        soLuong: number;
        ghiChu: string;
    }[];
}

export const orderService = {
    // 1. Tạo đơn hàng (OrdersAPI)
    createOrder: async (data: any) => {
        const rawResponse = await axiosClient.post('/OrdersAPI', data);
        return rawResponse as unknown as { message: string; donHang: any };
    },

    // 2. Lấy đơn hàng theo ID
    getOrder: async (maDonHang: string) => {
        const rawResponse = await axiosClient.get(`/OrdersAPI/${encodeURIComponent(maDonHang)}`);
        return rawResponse as unknown as any;
    },

    // 3. Lấy đơn hàng theo Bàn
    getOrderByTable: async (maBan: string) => {
        const rawResponse = await axiosClient.get(`/OrdersAPI/by-table/${encodeURIComponent(maBan)}`);
        return rawResponse as unknown as any;
    },

    // 4. Cập nhật đơn hàng
    updateOrder: async (maDonHang: string, data: any) => {
        const rawResponse = await axiosClient.put(`/OrdersAPI/${encodeURIComponent(maDonHang)}`, data);
        return rawResponse as unknown as { message: string; donHang: any };
    },

    // 5. Thêm món vào đơn (API cũ)
    addItemToOrder: async (maDonHang: string, item: { MaPhienBan: string; SoLuong: number }) => {
        const rawResponse = await axiosClient.post(`/OrdersAPI/${encodeURIComponent(maDonHang)}/add-item`, item);
        return rawResponse as unknown as { message: string; donHang: any };
    },

    // 6. Hoàn thành đơn hàng
    completeOrder: async (maDonHang: string) => {
        // Post không có body thì truyền object rỗng {} hoặc undefined
        const rawResponse = await axiosClient.post(`/OrdersAPI/${encodeURIComponent(maDonHang)}/complete`);
        return rawResponse as unknown as { message: string; donHang: any };
    },
    
    // 7. Cập nhật trạng thái (DatBanAPI)
    updateOrderStatus: async (maDonHang: string, maTrangThai: string) => {
        // Lưu ý: Nếu backend nhận [FromBody] string, cần gửi string dạng JSON chuẩn hoặc text
        // Ở đây gửi body là string maTrangThai
        const rawResponse = await axiosClient.put(
            `/DatBanAPI/CapNhatTrangThai/${encodeURIComponent(maDonHang)}`, 
            maTrangThai,
            { headers: { 'Content-Type': 'application/json' } } // Đảm bảo header JSON
        );
        return rawResponse as unknown as { message: string };
    },

    // 8. Lấy các booking đang active (DonHangsAPI)
    getActiveOrders: async () => {
        const rawResponse = await axiosClient.get('/DonHangsAPI/GetActiveBookings');
        return rawResponse as unknown as any[];
    },

    // 9. Thêm món vào bàn (Logic mới 1-N) (DonHangsAPI)
    addItemsToTable: async (payload: AddItemsToTablePayload) => {
        const rawResponse = await axiosClient.post('/DonHangsAPI/ThemMonVaoBan', payload);
        return rawResponse as unknown as { message: string };
    },

    // 10. Lấy chi tiết đơn hàng (DonHangsAPI)
    // Đã thay thế URLSearchParams thủ công bằng params của Axios
    getOrderDetail: async (maDonHang?: string, maBan?: string) => {
        const params: any = {};
        
        if (maDonHang) {
            params.maDonHang = maDonHang;
        }
        
        if (maBan) {
            params.maBan = maBan;
            // Tự động thêm thời gian hiện tại nếu tìm theo bàn
            params.dateTime = new Date().toISOString();
        }

        const rawResponse = await axiosClient.get('/DonHangsAPI/GetMyBookingDetail', {
            params: params // Axios tự động chuyển thành ?maDonHang=...&maBan=...
        });
        
        return rawResponse as unknown as any;
    }
};
