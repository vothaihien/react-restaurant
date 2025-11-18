import { request } from "../utils/api";

export const tablesApi = {
  getTables: () => request<any[]>("/api/BanAnsAPI"),

  getTablesByTime: (dateTime: string, soNguoi: number) =>
    request<any[]>(
      `/api/BanAnsAPI/GetStatusByTime?dateTime=${encodeURIComponent(
        dateTime
      )}&soNguoi=${soNguoi}`
    ),

  getTangs: () => request<any[]>("/api/TangAPI"),
};


