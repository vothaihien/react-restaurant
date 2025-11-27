import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { tablesApi } from "@/api/tables";
import { employeesApi } from "@/api/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Info, Palette, Type } from "lucide-react";

interface TableData {
  maBan: string;
  tenBan: string;
  sucChua: number;
  maTrangThai: string;
  tenTrangThai?: string;
  maTang?: string;
  tenTang?: string;
}

interface TangData {
  maTang: string;
  tenTang: string;
  banAns?: any[];
}

interface UISettings {
  theme: "light" | "dark" | "auto";
  primaryColor: string;
  fontSize: "small" | "medium" | "large";
}

const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [tables, setTables] = useState<TableData[]>([]);
  const [tangs, setTangs] = useState<TangData[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // UI Settings state
  const [uiSettings, setUiSettings] = useState<UISettings>(() => {
    const saved = localStorage.getItem("ui_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Chỉ lấy các field cần thiết
        return {
          theme: parsed.theme || "light",
          primaryColor: parsed.primaryColor || "indigo",
          fontSize: parsed.fontSize || "medium",
        };
      } catch {
        // Fallback to default
      }
    }
    return {
      theme: "light",
      primaryColor: "indigo",
      fontSize: "medium",
    };
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tablesData, tangsData, employeesData] = await Promise.all([
        tablesApi.getTables().catch(() => []),
        tablesApi.getTangs().catch(() => []),
        employeesApi.getEmployees().catch(() => []),
      ]);
      setTables(tablesData || []);
      setTangs(tangsData || []);
      setEmployees(employeesData || []);
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi tải dữ liệu",
        description: error?.message || "Không thể tải thông tin hệ thống.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUISettingChange = (key: keyof UISettings, value: any) => {
    const newSettings = { ...uiSettings, [key]: value };
    setUiSettings(newSettings);
    localStorage.setItem("ui_settings", JSON.stringify(newSettings));

    // Áp dụng ngay lập tức
    applyUISettings(newSettings);

    // Dispatch event để các component khác có thể cập nhật
    window.dispatchEvent(
      new CustomEvent("ui-settings-changed", { detail: newSettings })
    );

    notify({
      tone: "success",
      title: "Đã lưu cài đặt",
      description: "Cài đặt giao diện đã được lưu và áp dụng.",
    });
  };

  const applyUISettings = (settings: UISettings) => {
    const root = document.documentElement;

    // Áp dụng theme
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      // Auto - theo system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    // Áp dụng màu chủ đạo
    const colorMap: Record<string, { primary: string; ring: string }> = {
      indigo: { primary: "221.2 83.2% 53.3%", ring: "221.2 83.2% 53.3%" },
      blue: { primary: "217.2 91.2% 59.8%", ring: "217.2 91.2% 59.8%" },
      green: { primary: "142.1 76.2% 36.3%", ring: "142.1 76.2% 36.3%" },
      purple: { primary: "262.1 83.3% 57.8%", ring: "262.1 83.3% 57.8%" },
      red: { primary: "0 84.2% 60.2%", ring: "0 84.2% 60.2%" },
      orange: { primary: "24.6 95% 53.1%", ring: "24.6 95% 53.1%" },
    };
    const colors = colorMap[settings.primaryColor] || colorMap.indigo;
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--ring", colors.ring);

    // Áp dụng cỡ chữ
    const fontSizeMap: Record<string, string> = {
      small: "0.875rem", // 14px
      medium: "1rem", // 16px
      large: "1.125rem", // 18px
    };
    const baseFontSize = fontSizeMap[settings.fontSize] || fontSizeMap.medium;
    root.style.setProperty("--base-font-size", baseFontSize);
    root.style.fontSize = baseFontSize;
  };

  const primaryColors = [
    { value: "indigo", label: "Indigo", color: "bg-indigo-600" },
    { value: "blue", label: "Xanh dương", color: "bg-blue-600" },
    { value: "green", label: "Xanh lá", color: "bg-green-600" },
    { value: "purple", label: "Tím", color: "bg-purple-600" },
    { value: "red", label: "Đỏ", color: "bg-red-600" },
    { value: "orange", label: "Cam", color: "bg-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Cài đặt Hệ thống</h1>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          Đang tải thông tin...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin hệ thống */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Thông tin Hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Phiên bản:
                </span>
                <span className="text-sm text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Tổng số bàn:
                </span>
                <span className="text-sm text-gray-900 font-semibold">
                  {tables.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Số tầng:
                </span>
                <span className="text-sm text-gray-900 font-semibold">
                  {tangs.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Tổng số nhân viên:
                </span>
                <span className="text-sm text-gray-900 font-semibold">
                  {employees.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">
                  URL API:
                </span>
                <span className="text-sm text-gray-600">
                  http://localhost:5555
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin người dùng */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Thông tin Người dùng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && user.type === "admin" ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Họ tên:
                  </span>
                  <span className="text-sm text-gray-900">{user.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Mã nhân viên:
                  </span>
                  <span className="text-sm text-gray-900">
                    {user.employeeId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Vai trò:
                  </span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {user.tenVaiTro || "Nhân viên"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">
                    Loại tài khoản:
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    {user.tenVaiTro || "Nhân viên"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Không có thông tin người dùng</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danh sách tầng */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Danh sách Tầng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tangs.length > 0 ? (
              <div className="space-y-3">
                {tangs.map((tang) => {
                  const tablesInTang = tables.filter(
                    (t) => t.maTang === tang.maTang
                  );
                  return (
                    <div
                      key={tang.maTang}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {tang.tenTang}
                        </div>
                        <div className="text-sm text-gray-600">
                          {tablesInTang.length} bàn
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{tang.maTang}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Chưa có tầng nào</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cấu hình Giao diện */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Cấu hình Giao diện
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Màu chủ đạo
              </label>
              <div className="grid grid-cols-3 gap-3">
                {primaryColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      handleUISettingChange("primaryColor", color.value)
                    }
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition ${
                      uiSettings.primaryColor === color.value
                        ? "bg-opacity-10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={
                      uiSettings.primaryColor === color.value
                        ? {
                            borderColor: `hsl(var(--primary))`,
                            backgroundColor: `hsl(var(--primary) / 0.1)`,
                          }
                        : {}
                    }
                  >
                    <div className={`w-6 h-6 rounded-full ${color.color}`} />
                    <span className="text-sm text-gray-700">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Type className="w-4 h-4 inline mr-1" />
                Cỡ chữ
              </label>
              <div className="flex gap-2">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleUISettingChange("fontSize", size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      uiSettings.fontSize === size
                        ? "text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    style={
                      uiSettings.fontSize === size
                        ? { backgroundColor: "hsl(var(--primary))" }
                        : {}
                    }
                  >
                    {size === "small"
                      ? "Nhỏ"
                      : size === "medium"
                      ? "Vừa"
                      : "Lớn"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsView;



