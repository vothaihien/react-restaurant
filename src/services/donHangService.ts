// src/services/donHangService.ts
import { request } from './apiClient';

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
   getActiveBookings: (ngay: string) => // 1. Cho phép nhận 1 tham số 'ngay'
        request<DonHangActive[]>(`/api/DonHangsAPI/GetActiveBookings?ngay=${ngay}`),

    // API đã có trong DonHangsAPIController
    getMyBookingDetail: (params: { maDonHang?: string; maBan?: string; dateTime?: string }) => {
        const qs = new URLSearchParams();
        if (params.maDonHang) qs.set('maDonHang', params.maDonHang);
        if (params.maBan) qs.set('maBan', params.maBan);
        if (params.dateTime) qs.set('dateTime', params.dateTime);
        
        return request<any>(`/api/DonHangsAPI/GetMyBookingDetail?${qs.toString()}`);
    },
    
    // API đã có trong DonHangsAPIController
    getCustomersToCall: () => 
        request<any[]>('/api/DonHangsAPI/get-customers-to-call'),
};