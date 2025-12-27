import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useLocation, useNavigate } from "react-router-dom";

const LoginView: React.FC = () => {
  const { adminLogin } = useAuth();
  const { notify } = useFeedback();
  
  // State quản lý dữ liệu
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Kích hoạt animation khi vào trang
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- LOGIC XỬ LÝ (GIỮ NGUYÊN) ---
  let from = "/";
  if (location.state && location.state.from) {
      if (typeof location.state.from === 'string') {
          from = location.state.from;
      } else if (location.state.from.pathname) {
          from = location.state.from.pathname;
      }
  }

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
    <div className="flex min-h-screen w-full font-sans bg-[#FDFBF7] overflow-hidden text-slate-800">
      
      
      <style>{`
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slow-zoom { animation: slowZoom 25s infinite alternate linear; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .input-group:focus-within label, .input-filled label {
          transform: translateY(-1.5rem) scale(0.85);
          color: #BE123C; /* rose-700 */
          font-weight: 600;
        }
      `}</style>

      {/* 1. CỘT TRÁI: HÌNH ẢNH + HIỆU ỨNG (60%) */}
      <div className="hidden lg:block lg:w-3/5 relative overflow-hidden group">
        {/* Ảnh nền có hiệu ứng Zoom chậm */}
        <div className="absolute inset-0 bg-black">
             <img 
              src="https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop" 
              alt="Grand Luxury Restaurant" 
              className="w-full h-full object-cover opacity-90 animate-slow-zoom transition-opacity duration-700"
            />
        </div>

        {/* Lớp phủ Gradient Đỏ Rượu sang trọng */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/90 via-rose-900/40 to-transparent mix-blend-multiply"></div>
        
        {/* Nội dung trang trí bên trái */}
        <div className={`absolute bottom-0 left-0 p-20 w-full z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
           <div className="border-l-4 border-rose-500 pl-6 mb-6 backdrop-blur-sm bg-black/5 py-2 rounded-r-lg inline-block">
              <p className="text-rose-200 uppercase tracking-[0.2em] text-sm font-semibold mb-2">Cổng quản lý</p>
              <h1 className="text-5xl font-serif text-white font-bold leading-tight drop-shadow-xl">
                Viet <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-200 to-rose-400">Restaurent.</span>
              </h1>
           </div>
           <p className="text-gray-200 text-lg font-light max-w-md opacity-90 leading-relaxed">
             Hệ thống quản lý chuẩn mực, nơi sự tinh tế gặp gỡ hiệu quả vận hành.
           </p>
        </div>
      </div>

      {/* 2. CỘT PHẢI: FORM ĐĂNG NHẬP (40%) */}
      <div className="w-full lg:w-2/5 relative flex items-center justify-center p-8 lg:p-12 xl:p-24 bg-[#FFF0F5]">
        
        {/* --- HỌA TIẾT NỀN (TEXTURE) --- */}
        {/* Lớp vân giấy mờ */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        
        {/* Các đốm sáng màu đỏ mờ (Ambient Light) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-300/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-200/30 rounded-full blur-[80px] pointer-events-none"></div>

        {/* MAIN CARD: Hiệu ứng kính mờ trên nền sáng */}
        <div className={`w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(225,29,72,0.15)] border border-white p-10 relative z-20 transition-all duration-700 delay-200 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
          {/* Header */}
          <div className="text-center mb-10">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-500/30 mb-6 transform hover:rotate-12 transition-transform duration-300">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
             </div>
             <h2 className="text-3xl font-extrabold text-gray-900 font-serif tracking-tight">Xin chào, Quản trị viên</h2>
             <p className="text-rose-900/60 mt-2 font-medium">Đăng nhập để bắt đầu phiên làm việc</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Input 1: Floating Label + Animation */}
            <div className={`input-group relative group ${tenDangNhap ? 'input-filled' : ''}`}>
               <input
                 type="text"
                 id="username"
                 value={tenDangNhap}
                 onChange={(e) => setTenDangNhap(e.target.value)}
                 className="block w-full px-5 py-4 bg-white border border-rose-100 rounded-xl text-gray-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all duration-300 peer placeholder-transparent shadow-sm hover:shadow-md"
                 placeholder="Tên đăng nhập"
                 disabled={loading}
               />
               <label 
                 htmlFor="username"
                 className="absolute left-5 top-4 text-gray-400 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:text-gray-400 group-hover:text-rose-400"
               >
                 Tên đăng nhập
               </label>
               <div className="absolute right-4 top-4 text-gray-300 group-focus-within:text-rose-500 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
               </div>
            </div>

            {/* Input 2: Floating Label + Password Toggle */}
            <div className={`input-group relative group ${matKhau ? 'input-filled' : ''}`}>
               <input
                 type={showPassword ? "text" : "password"}
                 id="password"
                 value={matKhau}
                 onChange={(e) => setMatKhau(e.target.value)}
                 className="block w-full px-5 py-4 bg-white border border-rose-100 rounded-xl text-gray-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all duration-300 peer placeholder-transparent shadow-sm hover:shadow-md pr-12"
                 placeholder="Mật khẩu"
                 disabled={loading}
               />
               <label 
                 htmlFor="password"
                 className="absolute left-5 top-4 text-gray-400 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:text-gray-400 group-hover:text-rose-400"
               >
                 Mật khẩu
               </label>
               
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-4 top-4 text-gray-300 hover:text-rose-600 transition-colors focus:outline-none cursor-pointer"
               >
                 {showPassword ? (
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                 ) : (
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M5.221 5.221c.29-.265.59-.515.901-.746A9.99 9.99 0 0112 5c4.478 0 8.268 2.943 9.542 7 .295.937.49 1.944.568 2.986M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.046 10.046 0 01-1.574 2.59m0 0l2.8 2.8" />
                   </svg>
                 )}
               </button>
            </div>

            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                    <input 
                        id="remember-me" 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded cursor-pointer transition-all duration-200 hover:scale-110" 
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 font-medium cursor-pointer select-none">
                        Ghi nhớ đăng nhập
                    </label>
                </div>
                <div className="text-sm">
                    <a href="#" className="font-semibold text-rose-600 hover:text-rose-800 hover:underline transition-all">
                        Quên mật khẩu?
                    </a>
                </div>
            </div>

            {/* Premium Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-rose-600 to-rose-800 overflow-hidden shadow-lg shadow-rose-600/30 transition-all duration-300 hover:shadow-rose-600/50 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              
              <span className="relative z-10 flex items-center gap-2">
                 {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
                 {!loading && (
                   <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                   </svg>
                 )}
              </span>
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-rose-100 pt-6">
             <p className="text-rose-900/40 text-xs font-medium">
               
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginView;