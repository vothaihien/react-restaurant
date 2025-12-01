import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useLocation, useNavigate } from "react-router-dom";

const LoginView: React.FC = () => {
  const { adminLogin } = useAuth();
  const { notify } = useFeedback();
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loading, setLoading] = useState(false);
 
  const navigate = useNavigate();
  const location = useLocation();

  // Xử lý đường dẫn trước đó (Giữ nguyên)
  let from = "/";
 
  if (location.state && location.state.from) {
      if (typeof location.state.from === 'string') {
          from = location.state.from;
      } else if (location.state.from.pathname) {
          from = location.state.from.pathname;
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    // Logic đăng nhập (Giữ nguyên)
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

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);

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
    // Nền tổng thể được làm nhẹ nhàng hơn
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

      {/* Form lớn hơn, chia 2 cột */}
      <div className="max-w-4xl w-full flex bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Cột 1: Trang trí/Banner (Đã loại bỏ lớp phủ thừa và hình nền) */}
        <div 
          className="hidden md:flex flex-col justify-center items-center p-8 w-1/3 bg-indigo-600 text-white relative"
        >
          {/* **ĐÃ XÓA DÒNG LỚP PHỦ GÂY LỖI** */}
          <div className="text-center z-10">
            <h2 className="text-4xl font-bold mb-4">
               Chào mừng!
            </h2>
            <p className="text-indigo-100 text-lg">
              Nền tảng quản lý vận hành chuyên nghiệp nhất.
            </p>
          </div>
        </div>

        {/* Cột 2: Form Đăng nhập (Chiếm 2/3 không gian) */}
        <div className="w-full md:w-2/3 p-10 lg:p-14">
          
          {/* Logo/Header - Tiêu đề mới */}
          <div className="text-center mb-10">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-indigo-800 mb-2">
               HỆ THỐNG QUẢN LÝ NHÀ HÀNG
            </h1>
            <p className="text-gray-600 text-lg">Vui lòng đăng nhập bằng tài khoản quản trị/nhân viên</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tên đăng nhập */}
            <div>
              <label
                htmlFor="tenDangNhap"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Tên đăng nhập
              </label>
              <input
                id="tenDangNhap"
                type="text"
                value={tenDangNhap}
                onChange={(e) => setTenDangNhap(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition duration-300"
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label
                htmlFor="matKhau"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Mật khẩu
              </label>
              <input
                id="matKhau"
                type="password"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition duration-300"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold text-lg py-3 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white transition duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 Hệ thống quản lý nhà hàng</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;