import axiosClient from "@/api/axiosClient";
export interface CustomerSearchResult {
  found: boolean;
  maKhachHang?: string;
  tenKhach?: string;
  email?: string;
  soLanAn?: number;
  duocGiamGia?: boolean;
  message?: string;
}

export const khachHangService = {
  searchByPhone: async (phone: string): Promise<CustomerSearchResult> => {
    const url = `/DatBanAPI/TimKiemKhachHang/${phone}`;
    // Gọi API
    const rawResponse = await axiosClient.get(url);

    // Ép kiểu "Double Casting" và return trực tiếp (không dùng .data)
    return rawResponse as unknown as CustomerSearchResult;
  },

  createCustomer: async (data: any) => {
    const url = "/DatBanAPI/TaoKhachHang";
    // Gọi API
    const rawResponse = await axiosClient.post(url, data);

    // Ép kiểu và return trực tiếp (không dùng .data)
    return rawResponse as unknown as any;
  },
};
