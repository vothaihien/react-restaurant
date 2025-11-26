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

export interface Order {
  maDonHang: string;
  maNhanVien?: string;
  maKhachHang: string;
  maTrangThaiDonHang: string;
  tenTrangThai: string;
  thoiGianDatHang: string;
  tgDatDuKien?: string;
  tgNhanBan?: string;
  thanhToan: boolean;
  thoiGianKetThuc?: string;
  soLuongNguoiDK: number;
  tienDatCoc: number;
  ghiChu?: string;
  tenNguoiNhan?: string;
  sdtNguoiNhan?: string;
  emailNguoiNhan?: string;
  hoTenKhachHang: string;
  soDienThoaiKhach: string;
  emailKhachHang?: string;
  tenNhanVien?: string;
  danhSachBan?: string;
  tongTien: number;
}

export interface OrderDetail {
  maChiTietDonHang: number;
  maDonHang: string;
  maPhienBan: string;
  maCongThuc: string;
  soLuong: number;
  tenMonAn: string;
  tenPhienBan: string;
  gia: number;
  thanhTien: number;
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