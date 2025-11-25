// src/models/AuthModel.ts

// 1. Response khi Khách hàng đăng nhập
export interface CustomerAuthResponse {
    token: string;
    refreshToken: string;
    hoTen: string;
    role: 'KhachHang'; 
    maKhachHang: string;
}

// 2. Response khi Nhân viên/Admin đăng nhập
export interface EmployeeAuthResponse {
    token: string;
    refreshToken: string;
    hoTen: string;
    role: 'NhanVien' | 'Admin'; // Hoặc string nếu bạn chưa chuẩn hóa role
    maNhanVien: string;
    maVaiTro: string;
    tenVaiTro?: string;
}

// 3. Type chung để dùng trong State/Context/View
// (User có thể là Khách HOẶC Nhân viên)
export type User = CustomerAuthResponse | EmployeeAuthResponse;