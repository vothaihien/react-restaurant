import { request, BASE_URL } from "@/utils/api";

export const menuApi = {
  // Dishes
  getDishes: (params?: { maDanhMuc?: string; searchString?: string }) => {
    const qs = new URLSearchParams();
    if (params?.maDanhMuc) qs.set("maDanhMuc", params.maDanhMuc);
    if (params?.searchString) qs.set("searchString", params.searchString);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<any[]>(`/api/MonAnsAPI${suffix}`);
  },

  getDish: (id: string) =>
    request<any>(`/api/MonAnsAPI/${encodeURIComponent(id)}`),

  createDish: (data: {
    TenMonAn: string;
    MaDanhMuc?: string;
    IsShow?: boolean;
    HinhAnhUrls?: string[];
    PhienBanMonAns: Array<{
      MaPhienBan?: string;
      TenPhienBan: string;
      Gia: number;
      MaTrangThai?: string;
      IsShow?: boolean;
      ThuTu?: number;
      CongThucNauAns: Array<{
        MaNguyenLieu: string;
        SoLuongCanDung: number;
      }>;
    }>;
  }) => request<any>("/api/MonAnsAPI", { method: "POST", body: data }),

  getVersions: () => request<any[]>("/api/PhienBanAPI"),

  uploadImage: async (
    file: File,
    maMonAn?: string
  ): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const url = maMonAn
      ? `${BASE_URL}/api/MonAnsAPI/upload-image?maMonAn=${encodeURIComponent(
          maMonAn
        )}`
      : `${BASE_URL}/api/MonAnsAPI/upload-image`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Upload ảnh thất bại" }));
      throw new Error(error.message || "Upload ảnh thất bại");
    }

    return await response.json();
  },

  uploadMenuImage: async (
    file: File,
    maMenu?: string
  ): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const url = maMenu
      ? `${BASE_URL}/api/MenuAPI/upload-image?maMenu=${encodeURIComponent(
          maMenu
        )}`
      : `${BASE_URL}/api/MenuAPI/upload-image`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Upload ảnh thất bại" }));
      throw new Error(error.message || "Upload ảnh thất bại");
    }

    return await response.json();
  },

  // Categories
  getCategories: () => request<any[]>("/api/DanhMucAPI"),

  createCategory: (data: { TenDanhMuc: string; MaDanhMuc?: string }) =>
    request<any>("/api/DanhMucAPI", { method: "POST", body: data }),

  updateCategory: (maDanhMuc: string, data: { TenDanhMuc: string }) =>
    request<any>(`/api/DanhMucAPI/${encodeURIComponent(maDanhMuc)}`, {
      method: "PUT",
      body: data,
    }),

  deleteCategory: (maDanhMuc: string) =>
    request<any>(`/api/DanhMucAPI/${encodeURIComponent(maDanhMuc)}`, {
      method: "DELETE",
    }),

  // Menu theo khung giờ
  getMenuTheoKhungGio: (khungGio?: string) => {
    const qs = new URLSearchParams();
    if (khungGio) qs.set("khungGio", khungGio);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<any>(`/api/MenuAPI/TheoKhungGio${suffix}`);
  },

  // Menu hiện tại (tự động theo khung giờ)
  getMenuHienTai: () => request<any>("/api/MenuAPI/HienTai"),

  // Menu đang áp dụng
  getMenuDangApDung: (maLoaiMenu?: string) => {
    const qs = new URLSearchParams();
    if (maLoaiMenu) qs.set("maLoaiMenu", maLoaiMenu);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<any>(`/api/MenuAPI/DangApDung${suffix}`);
  },

  // Menu theo ngày lễ
  getMenuTheoNgayLe: (ngay?: Date) => {
    const qs = new URLSearchParams();
    if (ngay) qs.set("ngay", ngay.toISOString());
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<any>(`/api/MenuAPI/TheoNgayLe${suffix}`);
  },

  // Chi tiết menu theo mã
  getChiTietMenu: (maMenu: string) =>
    request<any>(`/api/MenuAPI/${encodeURIComponent(maMenu)}`),

  // Món ăn theo danh mục (E-menu)
  getMonAnTheoDanhMuc: (maDanhMuc?: string) => {
    const qs = new URLSearchParams();
    if (maDanhMuc) qs.set("maDanhMuc", maDanhMuc);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<any>(`/api/MenuAPI/MonAnTheoDanhMuc${suffix}`);
  },

  // CRUD Menu (Combo/Set menu)
  getAllMenus: (params?: { maLoaiMenu?: string; searchString?: string }) => {
    const qs = new URLSearchParams();
    if (params?.maLoaiMenu) qs.set("maLoaiMenu", params.maLoaiMenu);
    if (params?.searchString) qs.set("searchString", params.searchString);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<any>(`/api/MenuAPI${suffix}`);
  },

  createMenu: (data: {
    MaMenu?: string;
    TenMenu: string;
    MaLoaiMenu?: string;
    MaTrangThai?: string;
    GiaMenu: number;
    GiaGoc?: number;
    MoTa?: string;
    HinhAnh?: string;
    NgayBatDau?: string;
    NgayKetThuc?: string;
    ThuTu?: number;
    IsShow?: boolean;
    ChiTietMenus?: Array<{
      MaCongThuc: string;
      SoLuong: number;
      GhiChu?: string;
      ThuTu?: number;
    }>;
  }) => request<any>("/api/MenuAPI", { method: "POST", body: data }),

  updateMenu: (
    maMenu: string,
    data: {
      TenMenu?: string;
      MaLoaiMenu?: string;
      GiaMenu?: number;
      GiaGoc?: number;
      MoTa?: string;
      HinhAnh?: string;
      NgayBatDau?: string;
      NgayKetThuc?: string;
      ThuTu?: number;
      IsShow?: boolean;
      MaTrangThai?: string;
      ChiTietMenus?: Array<{
        MaCongThuc: string;
        SoLuong: number;
        GhiChu?: string;
        ThuTu?: number;
      }>;
    }
  ) =>
    request<any>(`/api/MenuAPI/${encodeURIComponent(maMenu)}`, {
      method: "PUT",
      body: data,
    }),

  deleteMenu: (maMenu: string) =>
    request<any>(`/api/MenuAPI/${encodeURIComponent(maMenu)}`, {
      method: "DELETE",
    }),

  // Loại menu
  getLoaiMenus: () => request<any>("/api/LoaiMenuAPI"),

  // Trạng thái menu
  getTrangThaiMenus: () => request<any>("/api/TrangThaiMenuAPI"),
};
