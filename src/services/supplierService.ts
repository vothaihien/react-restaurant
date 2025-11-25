// src/services/supplierService.ts
import axiosClient from '@/api/axiosClient'; // Đảm bảo đường dẫn import đúng

// Định nghĩa Interface cho Nhà Cung Cấp
export interface Supplier {
    maNcc: string;
    tenNcc: string;
    soDienThoai?: string;
    email?: string;
    diaChi?: string;
}

export const supplierService = {
<<<<<<< Updated upstream
    getSuppliers: () => 
        request<any[]>('/api/SuppliersAPI'),
=======
    // Lấy danh sách nhà cung cấp
    getSuppliers: async () => {
        // Axios gọi API (đã bỏ '/api' ở đầu)
        const rawResponse = await axiosClient.get('/SuppliersAPI');
        
        // Ép kiểu về mảng Supplier[]
        return rawResponse as unknown as Supplier[];
    },
>>>>>>> Stashed changes
};