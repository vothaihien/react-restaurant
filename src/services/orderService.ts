// src/services/orderService.ts
import { request } from './apiClient';


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
    createOrder: (data: { /* ... kiểu dữ liệu ... */ }) => 
        request<{ message: string; donHang: any }>('/api/OrdersAPI', { method: 'POST', body: data }),

    getOrder: (maDonHang: string) => 
        request<any>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}`),

    getOrderByTable: (maBan: string) => 
        request<any>(`/api/OrdersAPI/by-table/${encodeURIComponent(maBan)}`),

    updateOrder: (maDonHang: string, data: { /* ... kiểu dữ liệu ... */ }) => 
        request<{ message: string; donHang: any }>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}`, {
            method: 'PUT', body: data
        }),

    addItemToOrder: (maDonHang: string, item: { MaPhienBan: string; SoLuong: number }) =>
        request<{ message: string; donHang: any }>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}/add-item`, {
            method: 'POST', body: item
        }),

    completeOrder: (maDonHang: string) =>
        request<{ message: string; donHang: any }>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}/complete`, {
            method: 'POST'
        }),
    
    // Hàm này từ file gốc của bạn, có vẻ liên quan đến Order/Booking
    updateOrderStatus: (maDonHang: string, maTrangThai: string) =>
        request<{ message: string }>(`/api/DatBanAPI/CapNhatTrangThai/${maDonHang}`, {
            method: 'PUT',
            body: maTrangThai // Gửi string
        }),

    getActiveOrders: () => 
        request<any[]>('/api/DonHangsAPI/GetActiveBookings'),

    // 2. Thêm món vào một bàn cụ thể (Logic mới 1-N)
    // Gọi về: DonHangsAPIController.ThemMonVaoBan
    addItemsToTable: (payload: AddItemsToTablePayload) =>
        request<{ message: string }>('/api/DonHangsAPI/ThemMonVaoBan', {
            method: 'POST',
            body: payload
        }),


    // 3. Lấy chi tiết đơn hàng (đầy đủ món ăn, hình ảnh...)
    // Gọi về: DonHangsAPIController.GetMyBookingDetail
    getOrderDetail: (maDonHang?: string, maBan?: string) => {
        // Tạo Query String thủ công vì hàm request của bạn có vẻ không tự xử lý params object
        const params = new URLSearchParams();
        if (maDonHang) params.append('maDonHang', maDonHang);
        if (maBan) {
            params.append('maBan', maBan);
            params.append('dateTime', new Date().toISOString());
        }
        
        return request<any>(`/api/DonHangsAPI/GetMyBookingDetail?${params.toString()}`);
    }
};
