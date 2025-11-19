// src/services/dishService.ts
import { request, uploadImageFile } from './apiClient';

export const dishService = {
    getDishes: (params?: { maDanhMuc?: string; searchString?: string }) => {
        const qs = new URLSearchParams();
        if (params?.maDanhMuc) qs.set('maDanhMuc', params.maDanhMuc);
        if (params?.searchString) qs.set('searchString', params.searchString);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return request<any[]>(`/api/MonAnsAPI${suffix}`);
    },

    getDish: (id: string) => 
        request<any>(`/api/MonAnsAPI/${encodeURIComponent(id)}`),

    createDish: (data: { /* ... kiểu dữ liệu của món ăn ... */ }) => 
        request<any>('/api/MonAnsAPI', { method: 'POST', body: data }),

    // Dùng hàm upload chuyên dụng từ apiClient
    uploadImage: (file: File, maMonAn?: string) => 
        uploadImageFile(file, maMonAn),

    // Categories
    getCategories: () => 
        request<any[]>('/api/DanhMucAPI'),
};