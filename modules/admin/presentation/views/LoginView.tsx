import React, { useState } from "react";
import { useAuth } from "@/core/context/AuthContext";
import { useFeedback } from "@/core/context/FeedbackContext";

const LoginView: React.FC = () => {
  const { adminLogin } = useAuth();
  const { notify } = useFeedback();
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenDangNhap.trim() || !matKhau.trim()) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
      });
      return;
    }

    setLoading(true);
    try {
      await adminLogin(tenDangNhap.trim(), matKhau);
      notify({
        tone: "success",
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Đăng nhập thất bại",
        description: error?.message || "Tên đăng nhập hoặc mật khẩu không đúng.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quản lý Nhà hàng
            </h1>
            <p className="text-gray-600">Đăng nhập vào hệ thống quản trị</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="tenDangNhap"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tên đăng nhập
              </label>
              <input
                id="tenDangNhap"
                type="text"
                value={tenDangNhap}
                onChange={(e) => setTenDangNhap(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="matKhau"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mật khẩu
              </label>
              <input
                id="matKhau"
                type="password"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Hệ thống quản lý nhà hàng</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

