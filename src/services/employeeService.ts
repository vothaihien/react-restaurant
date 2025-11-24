// src/services/employeeService.ts
import { request } from './apiClient';

export const employeeService = {
    getEmployees: () => 
        request<any[]>('/api/EmployeesAPI'),

    getEmployee: (maNhanVien: string) => 
        request<any>(`/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`),

    createEmployee: (data: {
        HoTen: string;
        TenDangNhap: string;
        MatKhau: string;
        Email?: string;
        SoDienThoai?: string;
        MaVaiTro: string;
        MaTrangThai?: string;
    }) => request<{ message: string; nhanVien: any }>('/api/EmployeesAPI', {
        method: 'POST',
        body: data
    }),

    updateEmployee: (maNhanVien: string, data: {
        HoTen?: string;
        Email?: string;
        SoDienThoai?: string;
        MaVaiTro?: string;
        MaTrangThai?: string;
    }) => request<{ message: string; nhanVien: any }>(`/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`, {
        method: 'PUT',
        body: data
    }),

    deleteEmployee: (maNhanVien: string) =>
        request<{ message: string }>(`/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`, {
            method: 'DELETE'
        }),

    getRoles: () => 
        request<any[]>('/api/EmployeesAPI/roles'),
};