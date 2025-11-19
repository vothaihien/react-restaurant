import { request } from "../utils/api";

export const ordersApi = {
  // Orders
  createOrder: (data: {
    MaBan: string;
    MaKhachHang: string;
    MaNhanVien?: string;
    ChiTietDonHang: Array<{ MaPhienBan: string; SoLuong: number }>;
    GhiChu?: string;
  }) =>
    request<{ message: string; donHang: any }>("/api/OrdersAPI", {
      method: "POST",
      body: data,
    }),

  getOrder: (maDonHang: string) =>
    request<any>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}`),

  getOrderByTable: (maBan: string) =>
    request<any>(`/api/OrdersAPI/by-table/${encodeURIComponent(maBan)}`),

  updateOrder: (
    maDonHang: string,
    data: {
      ChiTietDonHang: Array<{ MaPhienBan: string; SoLuong: number }>;
      GhiChu?: string;
    }
  ) =>
    request<{ message: string; donHang: any }>(
      `/api/OrdersAPI/${encodeURIComponent(maDonHang)}`,
      {
        method: "PUT",
        body: data,
      }
    ),

  addItemToOrder: (
    maDonHang: string,
    item: { MaPhienBan: string; SoLuong: number }
  ) =>
    request<{ message: string; donHang: any }>(
      `/api/OrdersAPI/${encodeURIComponent(maDonHang)}/add-item`,
      {
        method: "POST",
        body: item,
      }
    ),

  completeOrder: (maDonHang: string) =>
    request<{ message: string; donHang: any }>(
      `/api/OrdersAPI/${encodeURIComponent(maDonHang)}/complete`,
      {
        method: "POST",
      }
    ),
};


