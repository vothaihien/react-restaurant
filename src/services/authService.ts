import axiosClient from 'src/api/axiosClient';
import { request } from './apiClient';

type AuthResponse = {
    token: string;
    hoTen: string;
    maKhachHang: string;
};

export const authService = {

    checkUser: (identifier: string) => {
        return axiosClient.post<{ userExists: boolean }>('/api/Auth/check-user', { identifier });
    },

    register: (payload: { identifier: string; hoTen: string; otp: string }) => {
        return axiosClient.post<AuthResponse>('/api/Auth/register', payload);
    },

    login: (payload: { identifier: string; otp: string }) => {
        return axiosClient.post<AuthResponse>('/api/Auth/login', payload);
    },
};