import axiosClient from '../api/axiosClient'; 
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
    const response = await axiosClient.get<CustomerSearchResult>(url);
    return response.data;
  },
  
  createCustomer: async (data: any) => {
      const url = '/DatBanAPI/TaoKhachHang'; 
      const response = await axiosClient.post(url, data);
      return response.data;
  }
  
};