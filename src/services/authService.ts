// src/services/authService.ts
import { request } from './apiClient';

type AuthResponse = {
    token: string;
    hoTen: string;
    maKhachHang: string;
};

export const authService = {
    checkUser: (identifier: string) => 
        request<{ userExists: boolean }>('/api/Auth/check-user', { 
            method: 'POST', body: { identifier } 
        }),

    register: (payload: { identifier: string; hoTen: string; otp: string }) =>
        request<AuthResponse>('/api/Auth/register', { 
            method: 'POST', body: payload 
        }),

    login: (payload: { identifier: string; otp: string }) =>
        request<AuthResponse>('/api/Auth/login', { 
            method: 'POST', body: payload 
        }),
};