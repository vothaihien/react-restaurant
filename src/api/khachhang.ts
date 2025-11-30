

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5555/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});


export interface KhachHang {
  maKhachHang: string;
  hoTen: string;
  soDienThoai: string;
  email?: string;
  hinhAnh?: string;
  soLanAnTichLuy: number;
  noShowCount?: number;
  ngayTao?: string;
  tongChiTieu?: number;
  lanCuoiDen?: string;
}

export interface KhachHangCreateModel {
  HoTen: string;
  SoDienThoai: string;
  Email?: string;
  HinhAnh?: string;
}

export interface KhachHangUpdateModel {
  HoTen: string;
  SoDienThoai: string;
  Email?: string;
  HinhAnh?: string;
}

export interface DonHang {
  maDonHang: string;
  thoiGianDatHang: string;
  tienDatCoc?: number;
  trangThai: string;
  soLuongNguoiDK: number;
  ghiChu?: string;
}


export interface DatBan {
  maDonHang: string;
  tenBan: string;
  thoiGianDatHang: string;
  trangThai: string; 
}

export interface ThongKeKhachHang {
  tongKhachHang: number;
  khachHangMoiThang: number;
  khachHangThanThiet: number;
  khachNoShow: number;
}

export interface DanhSachKhachHangResponse {
  totalRecords: number;
  page: number;
  pageSize: number;
  data: KhachHang[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}


export interface ChiTietKhachHangResponse {
  profile: { 
      maKhachHang: string; 
      hoTen: string; 
      soDienThoai: string; 
      email?: string; 
      hinhAnh?: string; 
      soLanAnTichLuy: number; 
      noShowCount?: number; 
      ngayTao?: string; 
  };
  donHangs: DonHang[]; 
  datBans: DatBan[]; 
}

export const customerApi = {
 
  layThongKe: async (): Promise<ThongKeKhachHang> => {
    try {
      const response = await apiClient.get('/KhachHang/ThongKe');
      const data = response.data;
      return {
        tongKhachHang: data.tongKhachHang || 0,
        khachHangMoiThang: data.khachHangMoiThang || 0,
        khachHangThanThiet: data.khachHangThanThiet || 0,
        khachNoShow: data.khachNoShow || 0
      };
    } catch (error: any) {
      console.error(' API Error in layThongKe:', error);
      return {
        tongKhachHang: 0,
        khachHangMoiThang: 0,
        khachHangThanThiet: 0,
        khachNoShow: 0
      };
    }
  },

  layDanhSach: async (search: string = '', page: number = 1, pageSize: number = 10): Promise<DanhSachKhachHangResponse> => {
    try {
      const response = await apiClient.get('/KhachHang', {
        params: { search, page, pageSize }
      });
      return response.data; 
    } catch (error: any) {
      console.error(' API Error in layDanhSach:', error);
      return {
        totalRecords: 0,
        page: page,
        pageSize: pageSize,
        data: []
      };
    }
  },

  
  layChiTiet: async (id: string): Promise<ApiResponse<ChiTietKhachHangResponse>> => {
    try {
      const response = await apiClient.get(`/KhachHang/${id}`);
      
      const apiData = response.data;
      
      if (apiData.success) {
          const dataToReturn: ChiTietKhachHangResponse = {
              profile: apiData.profile,
              donHangs: apiData.donHangs,
              datBans: apiData.datBans,
          };

          return {
              success: apiData.success, 
              message: apiData.message || 'Lấy chi tiết thành công',
              data: dataToReturn
          };
      } else {
         return {
            success: false,
            message: apiData.message || 'Lỗi xử lý API chi tiết khách hàng',
            data: undefined
         }
      }
      
    } catch (error: any) {
      console.error(' API Error in layChiTiet:', error);
      
      let errorMessage = 'Lỗi kết nối API hoặc server';
      
      if (error.response) {
          console.log(`ChiTiet API returned Status: ${error.response.status}`);
          

          if (error.response.status === 404) {
              errorMessage = error.response.data?.message || 'Khách hàng không tồn tại trong hệ thống (404)';
          } else {
              errorMessage = error.response.data?.message || `Lỗi Server (${error.response.status})`;
          }
      }
      
      return {
        success: false,
        message: errorMessage,
        data: undefined 
      };
    }
  },

  themKhachHang: async (model: KhachHangCreateModel): Promise<ApiResponse<KhachHang>> => {
    try {
      const response = await apiClient.post('/KhachHang', model);
      return response.data;
    } catch (error: any) {
        console.error(' API Error in themKhachHang:', error);
        // Backend trả về message ở dạng camelCase (thành công) hoặc message (lỗi)
        const message = error.response?.data?.message || 'Lỗi kết nối API hoặc server';
        return {
            success: false,
            message: message
        };
    }
  },

  capNhatKhachHang: async (id: string, model: KhachHangUpdateModel): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.put(`/KhachHang/${id}`, model);
      return response.data;
    } catch (error: any) {
        console.error(' API Error in capNhatKhachHang:', error);
        const message = error.response?.data?.message || 'Lỗi kết nối API hoặc server';
        return {
            success: false,
            message: message
        };
    }
  },

  xuatExcel: async (search: string = ''): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get('/KhachHang/Export', {
        params: { search }
      });
      return response.data;
    } catch (error: any) {
      console.error(' API Error in xuatExcel:', error);
      return {
        success: false,
        message: 'Lỗi kết nối API'
      };
    }
  },
};

export default customerApi;