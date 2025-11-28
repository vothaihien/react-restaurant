// utils/api/promotions.ts
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

export interface Promotion {
  maKhuyenMai: string;
  tenKhuyenMai: string;
  loaiKhuyenMai: 'PHAN_TRAM' | 'TIEN';
  giaTri: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: string;
  moTa?: string;
  apDungToiThieu?: number;
  apDungSanPhams?: AppliedProduct[];
}

export interface AppliedProduct {
  id: number;
  maCongThuc?: string;
  maDanhMuc?: string;
  tenCongThuc?: string;
  tenMonAn?: string;
  tenDanhMuc?: string;
  gia?: number;
}

export interface CreatePromotionData {
  maKhuyenMai: string;
  tenKhuyenMai: string;
  loaiKhuyenMai: 'PHAN_TRAM' | 'TIEN';
  giaTri: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: string;
  moTa?: string;
  apDungToiThieu?: number;
  apDungSanPhams?: { maCongThuc?: string; maDanhMuc?: string }[];
}

export interface UpdatePromotionData {
  tenKhuyenMai: string;
  loaiKhuyenMai: 'PHAN_TRAM' | 'TIEN';
  giaTri: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: string;
  moTa?: string;
  apDungToiThieu?: number;
  apDungSanPhams?: { maCongThuc?: string; maDanhMuc?: string }[];
}

export const promotionsApi = {
  getPromotions: () => 
    request<Promotion[]>("/api/KhuyenMai", { token: getToken() }),

  getPromotion: (id: string) =>
    request<Promotion>(`/api/KhuyenMai/${id}`, { token: getToken() }),

  createPromotion: (data: CreatePromotionData) =>
    request<{ message: string }>("/api/KhuyenMai", {
      method: "POST",
      body: data,
      token: getToken(),
    }),

  updatePromotion: (id: string, data: UpdatePromotionData) =>
    request<{ message: string }>(`/api/KhuyenMai/${id}`, {
      method: "PUT",
      body: data,
      token: getToken(),
    }),

  deletePromotion: (id: string) =>
    request<{ message: string }>(`/api/KhuyenMai/${id}`, {
      method: "DELETE",
      token: getToken(),
    }),

  getRecipes: () => 
    request<any[]>("/api/KhuyenMai/CongThucVaDanhMuc", { token: getToken() }),

  getCategories: () =>
    request<any[]>("/api/KhuyenMai/DanhMuc", { token: getToken() }),
};