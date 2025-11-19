// src/services/bookingService.ts
import { request } from './apiClient';

export const bookingService = {
    createReservation: (data: {
        DanhSachMaBan: string[];
        HoTenKhach: string;
        SoDienThoaiKhach: string;
        ThoiGianDatHang: string;
        SoLuongNguoi: number;
        GhiChu?: string;
        MaNhanVien?: string;
        TienDatCoc?: number;
    }) => request<{ message: string; donHang: any }>('/api/DatBanAPI/TaoDatBan', { 
        method: 'POST', body: data 
    }),

    getMyBookings: (token: string) => 
        request<any[]>('/api/BookingHistory/me', { token }),

    cancelBooking: (maDonHang: string, token: string) =>
        request<{ message: string }>(`/api/BookingHistory/cancel/${encodeURIComponent(maDonHang)}`, {
            method: 'POST',
            token
        }),
};