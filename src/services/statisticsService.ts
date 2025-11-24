import { request } from './apiClient';

export type RevenueByMonth = {
    thang: number;
    doanhThu: number;
};

export const statisticsService = {
    getRevenueByMonth: (nam: number) => 
        request<RevenueByMonth[]>(`/api/Statistics/doanh-thu-theo-thang?nam=${nam}`),
    
    // (Tui thêm hàm này từ code dashboard của bạn)
    getDashboardStats: (timeRange: 'TODAY' | 'WEEK' | 'MONTH') =>
        request<any>(`/api/Statistics/dashboard-stats?timeRange=${timeRange}`),
};
