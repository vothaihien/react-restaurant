import { request } from "@/utils/api";

const getToken = (): string | undefined => {
  try {
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      const user = JSON.parse(authUser);
      return user?.token;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

// 1. Interface cho DANH SÁCH đơn hàng (Khớp với API GetOrders / GetActiveBookings)
export interface Order {
  maDonHang: string;
  maNhanVien?: string;
  maKhachHang: string;
  maTrangThaiDonHang: string;
  tenTrangThai: string; // API trả về 'trangThai' hoặc 'tenTrangThai' tùy endpoint, nên check lại JSON
  trangThai?: string;   // Thêm cái này dự phòng nếu API trả về 'trangThai'
  thoiGianDatHang: string;
  tgDatDuKien?: string;
  tgNhanBan?: string;   // Dùng cho Booking
  thoiGianNhanBan?: string; // API GetActiveBookings trả về cái này
  thanhToan: boolean;
  thoiGianKetThuc?: string;
  soLuongNguoiDK: number; // API trả về soLuong hoặc soLuongNguoiDK
  soNguoi?: number;       // Thêm dự phòng
  tienDatCoc: number;
  ghiChu?: string;
  
  // --- THÔNG TIN KHÁCH HÀNG (QUAN TRỌNG) ---
  // API GetActiveBookings trả về 'tenNguoiNhan' (đã gộp logic ?? HoTen)
  tenNguoiNhan?: string; 
  sdtNguoiNhan?: string;
  emailNguoiNhan?: string;
  
  // API GetOrders thường trả về object khách hàng
  hoTenKhachHang?: string;
  soDienThoaiKhach?: string;
  emailKhachHang?: string;

  tenNhanVien?: string;
  danhSachBan?: string; // Hoặc listMaBan, banAn
  listMaBan?: string[];
  banAn?: string[];
  tongTien: number;
}

// 2. Interface cho CHI TIẾT Đơn Hàng (Khớp với API GetMyBookingDetail)
// Đây là cái bạn đang thiếu để hiển thị đúng trong Modal
export interface BookingDetail {
  maDonHang: string;
  thoiGianDat: string;
  tenBan: string;
  thoiGianNhanBan: string;
  thoiGianKetThuc?: string;
  soNguoi: number;
  ghiChu?: string;
  
  // --- KHỚP VỚI C# ChiTietDatBanDto ---
  tienDatCoc: number;      // Khớp với TienDatCoc
  trangThai: string;
  tenNguoiDat: string;     // Khớp với TenNguoiDat (C#)
  sdtNguoiDat: string;     // Khớp với SDTNguoiDat (C#)
  
  monAns: MonAnDatDto[];
}

export interface MonAnDatDto {
  tenMon: string;
  tenPhienBan: string;
  soLuong: number;
  donGia: number;
  hinhAnh: string;
  maBan: string;
  tenBan: string;
  ghiChu: string;
  thanhTien?: number; // Frontend tự tính hoặc API trả về
}

export interface OrderStats {
  tongSoDon: number;
  tongDoanhThu: number;
  donHoanThanh: number;
  donDaHuy: number;
  donChoXacNhan: number;
}

export const ordersApi = {
  // Lấy tất cả đơn hàng
  getOrders: () => 
    request<Order[]>("/api/DonHangsAPI", { token: getToken() }), // ✨ Đã sửa URL

  // Lấy đơn hàng theo trạng thái
  getOrdersByStatus: (status: string) => 
    request<Order[]>(`/api/DonHangsAPI/status/${status}`, { token: getToken() }), // ✨ Đã sửa URL

  // Lấy chi tiết đơn hàng
  getOrderDetail: (orderId: string) =>
    request<OrderDetail[]>(`/api/DonHangsAPI/${orderId}/details`, { token: getToken() }), // ✨ Đã sửa URL

  // Lấy thống kê đơn hàng
  getOrderStats: () =>
    request<OrderStats>("/api/DonHangsAPI/stats", { token: getToken() }), // ✨ Đã sửa URL

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: (orderId: string, status: string) =>
    request<{ message: string }>(`/api/DonHangsAPI/status/${orderId}`, { // ✨ Đã sửa URL
      method: "PUT",
      body: { maTrangThaiDonHang: status },
      token: getToken(),
    }),

  // Xóa đơn hàng
  deleteOrder: (orderId: string) =>
    request<{ message: string }>(`/api/DonHangsAPI/${orderId}`, { // ✨ Đã sửa URL
      method: "DELETE",
      token: getToken(),
    }),
};