// src/services/orderService.ts
import { request } from './apiClient';

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
};