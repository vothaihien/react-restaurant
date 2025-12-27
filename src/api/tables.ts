import { request } from "@/utils/api";

export const tablesApi = {
  getTables: () => request<any[]>("/api/BanAnsAPI"),

  getTablesByTime: (dateTime: string, soNguoi: number, maKhachHang?: string) =>
    request<any[]>(
      `/api/BanAnsAPI/GetStatusByTime?dateTime=${encodeURIComponent(
        dateTime
      )}&soNguoi=${soNguoi}${
        maKhachHang ? `&maKhachHang=${encodeURIComponent(maKhachHang)}` : ""
      }`
    ),

  getTangs: () => request<any[]>("/api/TangAPI"),
};



