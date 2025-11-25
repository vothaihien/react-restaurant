// src/services/statisticsService.ts
import axiosClient from '@/api/axiosClient'; // Đảm bảo đường dẫn import đúng

export type RevenueByMonth = {
    thang: number;
    doanhThu: number;
};

export const statisticsService = {
    // 1. Lấy doanh thu theo tháng
    getRevenueByMonth: async (nam: number) => {
        // Axios tự động chuyển object params thành ?nam=...
        const rawResponse = await axiosClient.get('/Statistics/doanh-thu-theo-thang', {
            params: { nam }
        });
        
        // Ép kiểu về mảng RevenueByMonth
        return rawResponse as unknown as RevenueByMonth[];
    },
    
<<<<<<< Updated upstream
    // (Tui thêm hàm này từ code dashboard của bạn)
    getDashboardStats: (timeRange: 'TODAY' | 'WEEK' | 'MONTH') =>
        request<any>(`/api/Statistics/dashboard-stats?timeRange=${timeRange}`),
=======
    // 2. Lấy thống kê Dashboard
    getDashboardStats: async (timeRange: 'TODAY' | 'WEEK' | 'MONTH') => {
        const rawResponse = await axiosClient.get('/Statistics/dashboard-stats', {
            params: { timeRange }
        });

        // Ép kiểu về any (hoặc Interface DashboardStat nếu bạn có import vào)
        return rawResponse as unknown as any;
    },
>>>>>>> Stashed changes
};