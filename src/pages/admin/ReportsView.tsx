import React, { useState, useEffect, useMemo } from "react";
import { formatVND } from "@/utils";
import { reportsApi } from "@/api/other";
import dashboardService, { TimeRange } from "@/services/dashboardService";
import { DashboardStat } from "@/models/DashboardStat";
import { useTheme } from "@/contexts/ThemeContext"; // Import theme context
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, CheckCircle2, Utensils, Users, Calendar } from "lucide-react"; // Dùng Lucide Icon

interface MonthlyRevenue {
  thang: number;
  doanhThu: number;
}

const StatisticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme(); // Lấy theme hiện tại
  
  // Kiểm tra quyền truy cập - chỉ admin mới được vào
  if (!user || user.type !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Logic kiểm tra Dark Mode để chỉnh màu biểu đồ
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [stats, setStats] = useState<DashboardStat>({
    tongDoanhThu: 0,
    soDonHoanThanh: 0,
    soBanPhucVu: 0,
    tongKhachHang: 0,
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("TODAY");

  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthlyError, setMonthlyError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError(null);
      try {
        const data = await dashboardService.getDashboardStats(timeRange);
        setStats(data);
      } catch (err) {
        console.error("Lỗi tải thống kê:", err);
        setStatsError("Không thể tải dữ liệu.");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  useEffect(() => {
    const fetchMonthlyChart = async () => {
      setLoadingMonthly(true);
      setMonthlyError(null);
      try {
        const data = await reportsApi.getRevenueByMonth(year);
        const normalizedData = (data || []).map((item: any) => ({
          thang: item.thang || item.Thang,
          doanhThu: item.doanhThu || item.DoanhThu || 0,
        }));
        setMonthly(normalizedData);
      } catch (err) {
        console.error("Lỗi tải biểu đồ:", err);
        setMonthlyError("Lỗi tải biểu đồ.");
        setMonthly([]);
      } finally {
        setLoadingMonthly(false);
      }
    };

    fetchMonthlyChart();
  }, [year]);

  const formatNumber = (val: number): string => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const formatYAxis = (tick: any) => {
    return new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(tick);
  };

  // Nút filter đổi màu theo theme
  const getFilterButtonClass = (range: TimeRange): string => {
    const baseClass = "px-4 py-2 rounded-lg font-medium text-sm transition-all";
    if (timeRange === range) {
      return `${baseClass} bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none`;
    }
    return `${baseClass} text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700`;
  };

  const renderStatCard = (
    title: string,
    value: string,
    icon: React.ReactNode,
    subtext?: string,
    isLoading: boolean = false,
    colorClass: string = "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
  ) => {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 transition-colors duration-300">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
          {isLoading ? (
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
          )}
          {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
        </div>
      </div>
    );
  };

  return (
    // CONTAINER CHÍNH: Đổi bg-gray-900 cứng thành bg-gray-50 dark:bg-gray-900
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 md:p-8 space-y-8 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bảng điều khiển</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tổng quan tình hình kinh doanh của nhà hàng.
          </p>
        </div>
        
        {/* TIME FILTER */}
        <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl">
          <button onClick={() => setTimeRange("TODAY")} className={getFilterButtonClass("TODAY")} disabled={loadingStats}>
            Hôm nay
          </button>
          <button onClick={() => setTimeRange("WEEK")} className={getFilterButtonClass("WEEK")} disabled={loadingStats}>
            Tuần này
          </button>
          <button onClick={() => setTimeRange("MONTH")} className={getFilterButtonClass("MONTH")} disabled={loadingStats}>
            Tháng này
          </button>
        </div>
      </div>

      {statsError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-800">
          {statsError}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard(
          "Doanh thu",
          formatVND(stats.tongDoanhThu),
          <DollarSign className="w-6 h-6" />,
          timeRange === "TODAY" ? "Hôm nay" : timeRange === "WEEK" ? "Tuần này" : "Tháng này",
          loadingStats,
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        )}
        {renderStatCard(
          "Đơn hoàn thành",
          formatNumber(stats.soDonHoanThanh),
          <CheckCircle2 className="w-6 h-6" />,
          "Đã thanh toán",
          loadingStats,
          "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        )}
        {renderStatCard(
          "Bàn đang phục vụ",
          formatNumber(stats.soBanPhucVu),
          <Utensils className="w-6 h-6" />,
          "Real-time",
          loadingStats,
          "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        )}
        {renderStatCard(
          "Khách hàng",
          formatNumber(stats.tongKhachHang),
          <Users className="w-6 h-6" />,
          "Lượt khách",
          loadingStats,
          "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        )}
      </div>

      {/* CHART SECTION */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Biểu đồ doanh thu năm {year}</h3>
            
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="bg-transparent border-none focus:ring-0 w-16 text-sm font-semibold text-gray-700 dark:text-gray-200 text-center"
                />
            </div>
        </div>

        {monthlyError && (
            <div className="text-center py-10 text-red-500 dark:text-red-400">{monthlyError}</div>
        )}

        {loadingMonthly && (
            <div className="h-[350px] w-full bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse"></div>
        )}

        {!loadingMonthly && !monthlyError && (
            <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                {/* Lưới: Sáng thì màu xám nhạt, Tối thì màu xám đậm */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                
                <XAxis
                    dataKey="thang"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                    dy={10}
                    tickFormatter={(thang) => `T${thang}`}
                />
                
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                    tickFormatter={formatYAxis}
                />
                
                <Tooltip
                    cursor={{ fill: isDarkMode ? "#1f2937" : "#f3f4f6" }}
                    contentStyle={{
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        color: isDarkMode ? "#f3f4f6" : "#111827"
                    }}
                    itemStyle={{ color: isDarkMode ? "#fff" : "#000" }} // Màu chữ giá trị
                    labelStyle={{ color: isDarkMode ? "#9ca3af" : "#6b7280", marginBottom: "0.25rem" }} // Màu chữ tiêu đề (Tháng)
                    formatter={(value: any) => [formatVND(Number(value)), "Doanh thu"]}
                />
                
                <Bar
                    dataKey="doanhThu"
                    fill="#6366f1" // Màu Indigo-500
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                    // Gradient cho cột đẹp hơn (Optional)
                />
                </BarChart>
            </ResponsiveContainer>
            </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsDashboard;