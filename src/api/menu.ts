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

  // Categories
  getCategories: () => request<any[]>("/api/DanhMucAPI"),

  // Menu theo khung giờ
  getMenuTheoKhungGio: (khungGio?: string) => {
    const qs = new URLSearchParams();
    if (khungGio) qs.set("khungGio", khungGio);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<any>(`/api/MenuAPI/TheoKhungGio${suffix}`);
  },

  // Menu hiện tại (tự động theo khung giờ)
  getMenuHienTai: () => request<any>("/api/MenuAPI/HienTai"),

  // Món ăn theo danh mục (E-menu)
  getMonAnTheoDanhMuc: (maDanhMuc?: string) => {
    const qs = new URLSearchParams();
    if (maDanhMuc) qs.set("maDanhMuc", maDanhMuc);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<any>(`/api/MenuAPI/MonAnTheoDanhMuc${suffix}`);
  },
};

