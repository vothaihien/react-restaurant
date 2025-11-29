import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7008/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để log lỗi chi tiết
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Types cho Khách Hàng
export interface KhachHang {
  MaKhachHang: string;
  HoTen: string;
  SoDienThoai: string;
  Email?: string;
  HinhAnh?: string;
  SoLanAnTichLuy: number;
  NoShowCount?: number;
  NgayTao?: string;
  TongChiTieu?: number;
  LanCuoiDen?: string;
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
  MaDonHang: string;
  ThoiGianDatHang: string;
  TienDatCoc?: number;
  TrangThai: string;
  SoLuongNguoiDK: number;
  GhiChu?: string;
}

export interface DatBan {
  MaDonHang: string;
  TenBan: string;
  ThoiGianDatHang: string;
  TrangThai: string;
}

export interface ThongKeKhachHang {
  TongKhachHang: number;
  KhachHangMoiThang: number;
  KhachHangThanThiet: number;
  SinhNhatThang: number;
}

export interface DanhSachKhachHangResponse {
  TotalRecords: number;
  Page: number;
  PageSize: number;
  Data: KhachHang[];
}

export interface ApiResponse<T> {
  Success: boolean;
  Message: string;
  Data?: T;
}

export interface ChiTietKhachHangResponse {
  Profile: KhachHang;
  DonHangs: DonHang[];
  DatBans: DatBan[];
}

// API functions với xử lý lỗi chi tiết
export const customerApi = {
  // Lấy thống kê
  layThongKe: async (): Promise<ThongKeKhachHang> => {
    try {
      console.log(' Calling API: /KhachHang/ThongKe');
      const response = await apiClient.get('/KhachHang/ThongKe');
      console.log(' API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Error in layThongKe:', error);
      // Trả về object mặc định nếu API fail
      return {
        TongKhachHang: 0,
        KhachHangMoiThang: 0,
        KhachHangThanThiet: 0,
        SinhNhatThang: 0
      };
    }
  },

  // Lấy danh sách khách hàng
  layDanhSach: async (search: string = '', page: number = 1, pageSize: number = 10): Promise<DanhSachKhachHangResponse> => {
    try {
      console.log('Calling API: /KhachHang', { search, page, pageSize });
      const response = await apiClient.get('/KhachHang', {
        params: { search, page, pageSize }
      });
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error(' API Error in layDanhSach:', error);
      // Trả về object mặc định nếu API fail
      return {
        TotalRecords: 0,
        Page: page,
        PageSize: pageSize,
        Data: []
      };
    }
  },

  // Tìm kiếm khách hàng theo số điện thoại
  timKiemTheoSdt: async (sdt: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(`/KhachHang/TimKiem/${sdt}`);
      return response.data;
    } catch (error) {
      console.error('API Error in timKiemTheoSdt:', error);
      return {
        Success: false,
        Message: 'Lỗi kết nối API'
      };
    }
  },

  // Lấy chi tiết khách hàng
  layChiTiet: async (id: string): Promise<ApiResponse<ChiTietKhachHangResponse>> => {
    try {
      const response = await apiClient.get(`/KhachHang/${id}`);
      return response.data;
    } catch (error) {
      console.error('API Error in layChiTiet:', error);
      return {
        Success: false,
        Message: 'Lỗi kết nối API'
      };
    }
  },

  // Thêm khách hàng mới
  themKhachHang: async (model: KhachHangCreateModel): Promise<ApiResponse<KhachHang>> => {
    try {
      const response = await apiClient.post('/KhachHang', model);
      return response.data;
    } catch (error) {
      console.error('API Error in themKhachHang:', error);
      return {
        Success: false,
        Message: 'Lỗi kết nối API'
      };
    }
  },

  // Cập nhật khách hàng
  capNhatKhachHang: async (id: string, model: KhachHangUpdateModel): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.put(`/KhachHang/${id}`, model);
      return response.data;
    } catch (error) {
      console.error('API Error in capNhatKhachHang:', error);
      return {
        Success: false,
        Message: 'Lỗi kết nối API'
      };
    }
  },

  // Xuất Excel
  xuatExcel: async (search: string = ''): Promise<ApiResponse<KhachHang[]>> => {
    try {
      const response = await apiClient.get('/KhachHang/Export', {
        params: { search }
      });
      return response.data;
    } catch (error) {
      console.error('API Error in xuatExcel:', error);
      return {
        Success: false,
        Message: 'Lỗi kết nối API'
      };
    }
  },
};

export default customerApi;