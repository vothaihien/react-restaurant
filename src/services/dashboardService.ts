import axiosClient from '@/api/axiosClient';
// Đảm bảo bạn đã có file model này, nếu chưa thì tạo interface ngay trong file này luôn cũng được
import { DashboardStat } from '@/models/DashboardStat'; 

export type TimeRange = 'TODAY' | 'WEEK' | 'MONTH';

const dashboardService = {
    getDashboardStats: async (timeRange: TimeRange = 'TODAY'): Promise<DashboardStat> => {
        // Gọi API: axiosClient sẽ tự động gắn Token vào header
        const rawResponse = await axiosClient.get('/Statistics/dashboard-stats', {
            params: { timeRange }
        });

        // 1. Không dùng response.data vì interceptor đã lấy ra rồi
        // 2. Dùng Double Casting để TypeScript không báo lỗi
        return rawResponse as unknown as DashboardStat;
    }
};

export default dashboardService;