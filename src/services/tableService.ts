// src/services/tableService.ts
import axiosClient from "@/api/axiosClient";

// --- ĐỊNH NGHĨA INTERFACE (Khớp 1-1 với BanAnDto.cs) ---

export interface Tang {
  maTang: string;
  tenTang: string;
}

export interface BanAn {
  maBan: string; // public string maBan { get; set; } = null!;
  tenBan: string; // public string tenBan { get; set; } = null!;

  maTrangThai?: string | null; // public string? maTrangThai
  tenTrangThai?: string | null; // public string? tenTrangThai

  sucChua?: number | null; // public int? sucChua

  maTang?: string | null; // public string? maTang
  tenTang?: string | null; // public string? tenTang

  isShow?: boolean | null; // public bool? isShow
}

// --- SERVICE ---
export const tableService = {
  // 1. Lấy tất cả bàn ăn
  getTables: async () => {
    const rawResponse = await axiosClient.get("/BanAnsAPI");
    // Ép kiểu về mảng BanAn[]
    return rawResponse as unknown as BanAn[];
  },

  // 2. Lấy trạng thái bàn theo thời gian (Check đặt bàn)
  getTablesByTime: async (dateTime: string, soNguoi: number) => {
    const rawResponse = await axiosClient.get("/BanAnsAPI/GetStatusByTime", {
      params: {
        dateTime: dateTime,
        soNguoi: soNguoi,
      },
    });
    // API này trả về danh sách bàn kèm trạng thái khả dụng
    return rawResponse as unknown as any[];
  },

  // 3. Lấy trạng thái bàn cho Dashboard
  getDashboardTableStatus: async (dateTime: string) => {
    const rawResponse = await axiosClient.get(
      "/BanAnsAPI/GetDashboardTableStatus",
      {
        params: { dateTime: dateTime },
      }
    );
    return rawResponse as unknown as any[];
  },

  getDashboardTableStatusManager: async (dateTime: string) => {
    const rawResponse = await axiosClient.get(
      "/BanAnsAPI/GetManagerTableStatus",
      {
        params: { dateTime: dateTime },
      }
    );
    // Map từ PascalCase (backend) sang camelCase (frontend)
    const data = rawResponse as unknown as any[];
    return data.map((item: any) => ({
      maBan: item.MaBan || item.maBan,
      tenBan: item.TenBan || item.tenBan,
      sucChua: item.SucChua || item.sucChua,
      maTang: item.MaTang || item.maTang,
      tenTang: item.TenTang || item.tenTang,
      trangThaiHienThi: item.TrangThaiHienThi || item.trangThaiHienThi || item.tenTrangThai,
      tenTrangThai: item.TrangThaiHienThi || item.trangThaiHienThi || item.tenTrangThai,
      ghiChu: item.GhiChu || item.ghiChu,
      maTrangThai: item.MaTrangThaiGoc || item.maTrangThaiGoc || item.maTrangThai,
      // Extract mã đơn hàng từ GhiChu nếu có
      maDonHang: item.GhiChu?.match(/Đơn #([A-Z0-9]+)/)?.[1] || 
                 item.ghiChu?.match(/Đơn #([A-Z0-9]+)/)?.[1] ||
                 item.MaDonHang || item.maDonHang,
    }));
  },

  // 4. Lấy danh sách tầng
  getTangs: async () => {
    const rawResponse = await axiosClient.get("/TangAPI");
    return rawResponse as unknown as Tang[];
  },
};
