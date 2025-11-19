// src/services/inventoryService.ts
import { request } from './apiClient';

export const inventoryService = {
    getIngredients: () => 
        request<any[]>('/api/InventoryAPI/ingredients'),

    getIngredient: (maNguyenLieu: string) => 
        request<any>(`/api/InventoryAPI/ingredients/${encodeURIComponent(maNguyenLieu)}`),

    createIngredient: (data: {
        TenNguyenLieu: string;
        DonViTinh?: string;
        SoLuongTonKho?: number;
    }) => request<any>('/api/InventoryAPI/ingredients', { method: 'POST', body: data }),

    importInventory: (data: {
        MaNhanVien: string;
        MaNhaCungCap?: string;
        ChiTiet: Array<{ MaCungUng: string; SoLuong: number; GiaNhap: number }>;
        GhiChu?: string;
    }) => request<{ message: string; nhapHang: any }>('/api/InventoryAPI/import', {
        method: 'POST',
        body: data
    }),

    getInventoryTransactions: (fromDate?: string, toDate?: string) => {
        const qs = new URLSearchParams();
        if (fromDate) qs.set('fromDate', fromDate);
        if (toDate) qs.set('toDate', toDate);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return request<any[]>(`/api/InventoryAPI/transactions${suffix}`);
    },
};