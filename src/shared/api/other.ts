import { request } from "../utils/api";

export const reportsApi = {
  getRevenueByMonth: (nam: number) =>
    request<Array<{ thang: number; doanhThu: number }>>(
      `/api/Statistics/doanh-thu-theo-thang?nam=${nam}`
    ),
};

export const suppliersApi = {
  getSuppliers: () => request<any[]>("/api/SuppliersAPI"),
};


