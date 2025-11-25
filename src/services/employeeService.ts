// src/services/employeeService.ts
import axiosClient from '@/api/axiosClient'; // Đảm bảo đường dẫn import đúng

// ------------------------------------------------------------------
// ĐỊNH NGHĨA INTERFACE (Để code sạch hơn thay vì dùng any)
// ------------------------------------------------------------------

export interface Employee {
    maNhanVien: string;
    hoTen: string;
    tenDangNhap: string;
    email?: string;
    soDienThoai?: string;
    maVaiTro: string;
    tenVaiTro?: string; // Thường join bảng sẽ có tên vai trò
    maTrangThai?: string;
}

export interface Role {
    maVaiTro: string;
    tenVaiTro: string;
}

// ------------------------------------------------------------------
// SERVICE
// ------------------------------------------------------------------

export const employeeService = {
    // 1. Lấy danh sách nhân viên
    getEmployees: async () => {
        // Đã bỏ '/api' ở đầu
        const rawResponse = await axiosClient.get('/EmployeesAPI');
        return rawResponse as unknown as Employee[];
    },

    // 2. Lấy chi tiết nhân viên
    getEmployee: async (maNhanVien: string) => {
        const rawResponse = await axiosClient.get(`/EmployeesAPI/${encodeURIComponent(maNhanVien)}`);
        return rawResponse as unknown as Employee;
    },

    // 3. Tạo nhân viên mới
    createEmployee: async (data: {
        HoTen: string;
        TenDangNhap: string;
        MatKhau: string;
        Email?: string;
        SoDienThoai?: string;
        MaVaiTro: string;
        MaTrangThai?: string;
    }) => {
        // Dùng axiosClient.post, tự động xử lý body JSON
        const rawResponse = await axiosClient.post('/EmployeesAPI', data);
        
        return rawResponse as unknown as { message: string; nhanVien: Employee };
    },

    // 4. Cập nhật nhân viên
    updateEmployee: async (maNhanVien: string, data: {
        HoTen?: string;
        Email?: string;
        SoDienThoai?: string;
        MaVaiTro?: string;
        MaTrangThai?: string;
    }) => {
        // Dùng axiosClient.put
        const rawResponse = await axiosClient.put(`/EmployeesAPI/${encodeURIComponent(maNhanVien)}`, data);
        
        return rawResponse as unknown as { message: string; nhanVien: Employee };
    },

    // 5. Xóa nhân viên
    deleteEmployee: async (maNhanVien: string) => {
        // Dùng axiosClient.delete
        const rawResponse = await axiosClient.delete(`/EmployeesAPI/${encodeURIComponent(maNhanVien)}`);
        
        return rawResponse as unknown as { message: string };
    },

    // 6. Lấy danh sách vai trò (Roles) để fill dropdown
    getRoles: async () => {
        const rawResponse = await axiosClient.get('/EmployeesAPI/roles');
        return rawResponse as unknown as Role[];
    },
};