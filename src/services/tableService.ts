// src/services/tableService.ts
import { request } from './apiClient';

export interface Tang {
    maTang: string;
    tenTang: string;
}

export const tableService = {
    getTables: () => 
        request<any[]>('/api/BanAnsAPI'),

    getTablesByTime: (dateTime: string, soNguoi: number) =>
        request<any[]>(`/api/BanAnsAPI/GetStatusByTime?dateTime=${encodeURIComponent(dateTime)}&soNguoi=${soNguoi}`),

    getDashboardTableStatus: (dateTime: string) => 
        request<any[]>(`/api/BanAnsAPI/GetDashboardTableStatus?dateTime=${encodeURIComponent(dateTime)}`),

    getTangs: () => 
        request<any[]>('/api/TangAPI'),
};