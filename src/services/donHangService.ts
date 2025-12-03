// src/services/donHangService.ts
import axiosClient from "@/api/axiosClient"; 

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

// --- THÊM INTERFACE CHO PAYLOAD GỌI MÓN ---
export interface AddItemsToOrderPayload {
  maDonHang: string;
  items: {
    maMonAn: string;
    maPhienBan: string;
    soLuong: number;
    ghiChu: string;
  }[];
}

export const donHangService = {
  // 1. Lấy danh sách đơn hàng active theo ngày
  getActiveBookings: async (ngay: string) => {
    const rawResponse = await axiosClient.get(
      "/DonHangsAPI/GetActiveBookings",
      {
        params: { ngay },
      }
    );
    return rawResponse as unknown as DonHangActive[];
  },

  // 2. Lấy chi tiết đơn hàng
  getMyBookingDetail: async (params: {
    maDonHang?: string;
    maBan?: string;
    dateTime?: string;
  }) => {
    const rawResponse = await axiosClient.get(
      "/DonHangsAPI/GetMyBookingDetail",
      {
        params: params,
      }
    );
    return rawResponse as unknown as any;
  },

  // 3. Lấy danh sách khách hàng cần gọi điện nhắc nhở
  getCustomersToCall: async () => {
    const rawResponse = await axiosClient.get(
      "/DonHangsAPI/get-customers-to-call"
    );
    return rawResponse as unknown as any[];
  },

  // --- 4. THÊM MỚI: GỌI MÓN VÀO ĐƠN HÀNG (API Mới) ---
  addItemsToOrder: async (payload: AddItemsToOrderPayload) => {
    // Gọi đến API [HttpPost("ThemMonVaoDon")] trong DonHangsAPIController
    const rawResponse = await axiosClient.post(
      "/DonHangsAPI/ThemMonVaoDon", 
      payload
    );
    
    // Trả về kết quả (message, tongTien mới)
    return rawResponse as unknown as { message: string; tongTien: number };
  },
};