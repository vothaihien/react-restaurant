import { request } from './apiClient';

interface StaffBookingResponse {
  Success: boolean;
  Message: string;
  MaDonHang: string;
  KhuyenMai: string;
}

export const bookingService = {
  createReservation: (data: any) => 
      request<any>('/api/DatBanAPI/TaoDatBan', { method: 'POST', body: data }),

  // 2. API MỚI (Dành cho Nhân viên Lễ tân) -> Gọi vào staff/create
  createReservationByStaff: (data: {
      DanhSachMaBan: string[];
      HoTenKhach: string;
      SoDienThoaiKhach: string;
      Email?: string | null;
      ThoiGianDatHang: string;
      SoLuongNguoi: number;
      MaNhanVien: string; // Bắt buộc phải có mã nhân viên
  }) => request<StaffBookingResponse>('/api/DatBanAPI/staff/create', { 
      method: 'POST', body: data 
  }),

  // ... Các hàm khác (getMyBookings, cancelBooking...) giữ nguyên
  getMyBookings: (token: string) => 
      request<any[]>('/api/BookingHistory/me', { token }),

  cancelBooking: (maDonHang: string, token: string) =>
      request<{ message: string }>(`/api/BookingHistory/cancel/${encodeURIComponent(maDonHang)}`, {
          method: 'POST',
          token
      }),
};