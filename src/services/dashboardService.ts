import axiosClient from '../api/axiosClient';
import { DashboardStat } from '../models/DashboardStat';

export type TimeRange = 'TODAY' | 'WEEK' | 'MONTH';

const dashboardService = {
    getDashboardStats: async (timeRange: TimeRange = 'TODAY'): Promise<DashboardStat> => {
        // Gọi API
        const response = await axiosClient.get<DashboardStat>('/Statistics/dashboard-stats', {
            params: { timeRange }
        });
        return response.data;
    }
};

export default dashboardService;