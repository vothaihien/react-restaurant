import { request } from "../utils/api";

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

  uploadImage: async (
    file: File,
    maMonAn?: string
  ): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const BASE_URL = (await import("../utils/api")).BASE_URL;

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
};
