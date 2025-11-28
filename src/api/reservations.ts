import { request } from "@/utils/api";

export const reservationsApi = {
  createReservation: (data: {
    DanhSachMaBan: string[];
    HoTenKhach: string;
    SoDienThoaiKhach: string;
    ThoiGianDatHang: string;
    SoLuongNguoi: number;
    GhiChu?: string;
    MaNhanVien?: string;
    TienDatCoc?: number;
    MaKhachHang?: string;
    Email?: string;
  }) =>
    request<{ 
      message: string; 
      donHang?: any;
      success?: boolean;
      requirePayment?: boolean;
      paymentUrl?: string;
      depositAmount?: number;
      maDonHang?: string;
      danhSachBan?: string;
    }>("/api/DatBanAPI/TaoDatBan", {
      method: "POST",
      body: data,
    }),

  updateOrderStatus: (maDonHang: string, maTrangThai: string) =>
    request<{ message: string }>(
      `/api/DatBanAPI/CapNhatTrangThai/${maDonHang}`,
      {
        method: "PUT",
        body: maTrangThai, // Backend nhận string trực tiếp, không phải object
      }
    ),

  getMyBookings: (token: string) =>
    request<any[]>("/api/BookingHistory/me", { token }),

  cancelBooking: (maDonHang: string, token: string) =>
    request<{ message: string }>(
      `/api/BookingHistory/cancel/${encodeURIComponent(maDonHang)}`,
      {
        method: "POST",
        token,
      }
    ),
};

