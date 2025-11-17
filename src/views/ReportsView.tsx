import React, { useState, useEffect, useMemo } from "react";
import { formatVND } from "@/shared/utils"; // Giữ lại hàm format tiền của bạn
import { Api } from "@/shared/utils/api"; // Giữ lại để gọi API cho chart

import dashboardService, { TimeRange } from "@/services/dashboardService";

import { DashboardStat } from "@/models/DashboardStat";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const IconDoanhThu = () => <span className="text-2xl">💰</span>;
const IconDonHang = () => <span className="text-2xl">✅</span>;
const IconBanPhucVu = () => <span className="text-2xl">🍽️</span>;
const IconKhachHang = () => <span className="text-2xl">👥</span>;

interface MonthlyRevenue {
  thang: number;
  doanhThu: number;
}

const StatisticsDashboard: React.FC = () => {
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
        console.error("Lỗi tải thống kê 4 thẻ:", err);
        console.log("Lỗi: ", err);
        setStatsError("Lỗi tải dữ liệu thống kê.");
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
        const data = await Api.getRevenueByMonth(year);

        const normalizedData = (data || []).map((item: any) => ({
          thang: item.thang || item.Thang,
          doanhThu: item.doanhThu || item.DoanhThu || 0,
        }));
        setMonthly(normalizedData);
      } catch (err) {
        console.error("Lỗi tải biểu đồ tháng:", err);
        setMonthlyError("Lỗi tải dữ liệu biểu đồ.");
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

  const getFilterButtonClass = (range: TimeRange): string => {
    const baseClass = "px-4 py-2 rounded-lg font-medium text-sm transition-all";
    if (timeRange === range) {
      return `${baseClass} bg-gray-800 text-white shadow-md`;
    }
    return `${baseClass} bg-gray-200 text-gray-700 hover:bg-gray-300`;
  };

  const renderStatCard = (
    title: string,
    value: string,
    icon: React.ReactNode,
    subtext?: string,
    isLoading: boolean = false
  ) => {
    return (
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          {isLoading ? (
            <div className="h-7 bg-gray-200 rounded-md w-3/4 animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
      </div>
    );
  };

  const totalYearRevenue = useMemo(() => {
    return monthly.reduce((acc, month) => acc + month.doanhThu, 0);
  }, [monthly]);

  const formatYAxis = (tick) => {
    return new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(tick);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bảng điều khiển</h1>
          <p className="text-gray-400">
            Chào mừng trở lại, xem tổng quan nhà hàng của bạn.
          </p>
        </div>
        <div className="flex space-x-2 p-1 bg-gray-800 rounded-lg">
          <button
            onClick={() => setTimeRange("TODAY")}
            className={getFilterButtonClass("TODAY")}
            disabled={loadingStats}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setTimeRange("WEEK")}
            className={getFilterButtonClass("WEEK")}
            disabled={loadingStats}
          >
            Tuần này
          </button>
          <button
            onClick={() => setTimeRange("MONTH")}
            className={getFilterButtonClass("MONTH")}
            disabled={loadingStats}
          >
            Tháng này
          </button>
        </div>
      </div>

      {statsError && (
        <div className="text-red-400 bg-red-900 p-3 rounded-lg">
          {statsError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard(
          "Tổng doanh thu",
          formatVND(stats.tongDoanhThu),
          <IconDoanhThu />,
          timeRange === "TODAY"
            ? "Trong hôm nay"
            : timeRange === "WEEK"
            ? "Trong tuần này"
            : "Trong tháng này",
          loadingStats
        )}
        {renderStatCard(
          "Số đơn đã hoàn thành",
          formatNumber(stats.soDonHoanThanh),
          <IconDonHang />,
          "Số đơn đã thanh toán thành công",
          loadingStats
        )}
        {renderStatCard(
          "Số bàn đang phục vụ",
          formatNumber(stats.soBanPhucVu),
          <IconBanPhucVu />,
          "Số bàn đang có khách (real-time)",
          loadingStats
        )}
        {renderStatCard(
          "Tổng số khách hàng",
          formatNumber(stats.tongKhachHang),
          <IconKhachHang />,
          "Số lượt khách đã phục vụ",
          loadingStats
        )}
      </div>

      {monthlyError && (
        <div className="text-red-400 bg-red-900 p-3 rounded-lg text-center">
          {monthlyError}
        </div>
      )}

      {/* Xử lý Loading (Kiểu mới - Skeleton cho biểu đồ) */}
      {loadingMonthly && (
        <div
          className="bg-gray-700 p-4 rounded-lg animate-pulse"
          style={{ height: 350 }}
        >
          <div className="h-full bg-gray-600 rounded"></div>
        </div>
      )}

      {/* Hiển thị biểu đồ khi có dữ liệu */}
      {!loadingMonthly && !monthlyError && monthly.length > 0 && (
        // Recharts cần set chiều cao cho container
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthly} // Dữ liệu của bạn
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              {/* Lưới nền (màu xám mờ) */}
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />

              {/* Trục X (Tháng) */}
              <XAxis
                dataKey="thang"
                stroke="#9ca3af" // Màu text-gray-400
                tickFormatter={(thang) => `T${thang}`} // Hiển thị: T1, T2...
              />

              {/* Trục Y (Doanh thu) */}
              <YAxis
                stroke="#9ca3af" // Màu text-gray-400
                tickFormatter={formatYAxis} // Dùng hàm format ngắn gọn
              />

              {/* Tooltip khi hover (hiển thị số tiền đầy đủ) */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#374151", // Màu bg-gray-700
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => [formatVND(Number(value)), "Doanh thu"]} 
              />

            
              <Bar
                dataKey="doanhThu"
                fill="#4ade80" 
                name="Doanh thu"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex justify-end items-center gap-2 pt-4 border-t border-gray-700">
        <label htmlFor="year-select" className="text-sm text-gray-400">
          Chọn năm:
        </label>
        <input
          id="year-select"
          type="number"
          value={year}
          onChange={(e) =>
            setYear(parseInt(e.target.value) || new Date().getFullYear())
          }
          className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-1 w-28 text-center"
        />
      </div>
    </div>
  );
};

export default StatisticsDashboard;
