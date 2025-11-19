// src/services/supplierService.ts
import { request } from './apiClient';

export const supplierService = {
    getSuppliers: () => 
        request<any[]>('/api/SuppliersAPI'),
};