<<<<<<< Updated upstream
import axiosClient from 'src/api/axiosClient';
import { request } from './apiClient';
=======
// src/services/AuthService.ts
import axiosClient from '@/api/axiosClient';
import { StorageKeys } from '@/constants/StorageKeys';
>>>>>>> Stashed changes

// Import kiểu dữ liệu từ file model vừa tạo
import { CustomerAuthResponse, EmployeeAuthResponse } from '@/models/AuthModel';

export const authService = {
    // 1. Kiểm tra User
    checkUser: async (identifier: string) => {
        const rawResponse = await axiosClient.post('/Auth/check-user', { identifier });
        return rawResponse as unknown as { userExists: boolean };
    },

    // 2. Đăng ký (Trả về CustomerAuthResponse)
    register: async (payload: { identifier: string; hoTen: string; otp: string }) => {
        const rawResponse = await axiosClient.post('/Auth/register', payload);
        const response = rawResponse as unknown as CustomerAuthResponse;
        
        // Lưu token
        if (response.token) localStorage.setItem(StorageKeys.ACCESS_TOKEN, response.token); 
        if (response.refreshToken) localStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
        
        return response;
    },

<<<<<<< Updated upstream
    login: (payload: { identifier: string; otp: string }) => {
        return axiosClient.post<AuthResponse>('/api/Auth/login', payload);
    },
=======
    // 3. Đăng nhập Khách (Trả về CustomerAuthResponse)
    login: async (payload: { identifier: string; otp: string }) => {
        const rawResponse = await axiosClient.post('/Auth/login', payload);
        const response = rawResponse as unknown as CustomerAuthResponse;

        if (response.token) localStorage.setItem(StorageKeys.ACCESS_TOKEN, response.token); 
        if (response.refreshToken) localStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
        
        return response;
    },

    // 4. Đăng nhập Admin (Trả về EmployeeAuthResponse)
    adminLogin: async (payload: { tenDangNhap: string; matKhau: string }) => {
        const rawResponse = await axiosClient.post('/Auth/admin/login', payload);
        const response = rawResponse as unknown as EmployeeAuthResponse;
        
        if (response.token) localStorage.setItem(StorageKeys.ACCESS_TOKEN, response.token); 
        if (response.refreshToken) localStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
        
        return response;
    },

    logout: () => {
        localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
        localStorage.removeItem(StorageKeys.REFRESH_TOKEN);
    }
>>>>>>> Stashed changes
};