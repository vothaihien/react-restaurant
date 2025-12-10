// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { authService } from "@/services/authService";
import { StorageKeys } from "@/constants/StorageKeys";
import { khachHangService } from "@/services/khachHangService";
import { isTokenExpiringSoon, getTimeUntilExpiration } from "@/utils/jwt";
import axios from "axios";

// --- CÁC TYPE GIỮ NGUYÊN ---
type ContactInfo = {
  identifier?: string;
  email?: string;
  phone?: string;
};

type CustomerUser = {
  token: string;
  name: string;
  customerId: string;
  type: "customer";
} & ContactInfo;

type EmployeeUser = {
  token: string;
  name: string;
  employeeId: string;
  maVaiTro: string;
  tenVaiTro: string;
  type: "admin" | "staff";
} & ContactInfo;

type AuthUser = CustomerUser | EmployeeUser | null;

interface AuthContextType {
  user: AuthUser;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean; // <--- THÊM CÁI NÀY ĐỂ FIX LỖI F5
  checkUser: (identifier: string) => Promise<{ userExists: boolean }>;
  login: (identifier: string, otp: string) => Promise<void>;
  register: (identifier: string, name: string, otp: string) => Promise<void>;
  adminLogin: (tenDangNhap: string, matKhau: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser>(null);
  // Thêm state loading, mặc định là TRUE để chặn redirect lung tung lúc mới F5
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Ref để lưu timeout ID cho việc tự động refresh token
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref để tránh refresh đồng thời nhiều lần
  const isRefreshingRef = useRef<boolean>(false);

  // --- CÁC HÀM XỬ LÝ CONTACT (GIỮ NGUYÊN) ---
  const buildContactInfo = (identifier?: string): ContactInfo => {
    if (!identifier) return {};
    const trimmed = identifier.trim();
    if (!trimmed) return {};
    if (trimmed.includes("@")) {
      return { identifier: trimmed, email: trimmed };
    }
    return { identifier: trimmed, phone: trimmed };
  };

  const enrichContactInfo = async (
    contact: ContactInfo
  ): Promise<ContactInfo> => {
    if (contact.email || !contact.phone) return contact;
    try {
      const result = await khachHangService.searchByPhone(contact.phone);
      if (result?.email) {
        return { ...contact, email: result.email };
      }
      return contact;
    } catch {
      return contact;
    }
  };

  // Function để refresh token tự động
  const refreshTokenSilently = async (): Promise<boolean> => {
    // Tránh refresh đồng thời nhiều lần
    if (isRefreshingRef.current) {
      return false;
    }

    try {
      isRefreshingRef.current = true;
      const refreshToken = localStorage.getItem(StorageKeys.REFRESH_TOKEN);
      
      if (!refreshToken) {
        return false;
      }

      // Gọi API refresh token (dùng axios thường để tránh interceptor loop)
      const result = await axios.post('http://localhost:5555/api/Auth/refresh-token', {
        refreshToken: refreshToken
      });

      const { accessToken, newRefreshToken } = result.data;

      if (!accessToken) {
        return false;
      }

      // Lưu token mới
      localStorage.setItem(StorageKeys.ACCESS_TOKEN, accessToken);
      if (newRefreshToken) {
        localStorage.setItem(StorageKeys.REFRESH_TOKEN, newRefreshToken);
      }

      // Cập nhật user state với token mới
      setUser((prevUser) => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          token: accessToken,
        };
      });

      return true;
    } catch (error) {
      console.error('Lỗi refresh token tự động:', error);
      // Nếu refresh thất bại, logout user
      setUser(null);
      localStorage.removeItem("auth_user");
      localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
      localStorage.removeItem(StorageKeys.REFRESH_TOKEN);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Function để setup auto refresh token
  const setupAutoRefresh = (token: string) => {
    // Clear timeout cũ nếu có
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Kiểm tra token có hợp lệ không
    if (!token) {
      return;
    }

    // Kiểm tra xem token có sắp hết hạn không (trong 5 phút)
    if (isTokenExpiringSoon(token, 300)) {
      // Nếu sắp hết hạn, refresh ngay
      refreshTokenSilently();
    }

    // Tính thời gian đến khi cần refresh (5 phút trước khi hết hạn)
    const timeUntilRefresh = getTimeUntilExpiration(token) - 5 * 60 * 1000; // 5 phút = 300000ms

    if (timeUntilRefresh > 0) {
      // Set timeout để refresh trước khi hết hạn
      refreshTimeoutRef.current = setTimeout(() => {
        refreshTokenSilently().then((success) => {
          if (success) {
            // Sau khi refresh thành công, setup lại cho token mới
            const newToken = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
            if (newToken) {
              setupAutoRefresh(newToken);
            }
          }
        });
      }, timeUntilRefresh);
    } else {
      // Nếu token đã hết hạn hoặc sắp hết hạn, refresh ngay
      refreshTokenSilently();
    }
  };

  // --- QUAN TRỌNG: Load user từ localStorage khi F5 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        const raw = localStorage.getItem("auth_user");
        if (raw) {
          const parsedUser = JSON.parse(raw);
          // Kiểm tra xem dữ liệu có hợp lệ không (có token không)
          if (parsedUser && parsedUser.token) {
             setUser(parsedUser);
          } else {
             // Nếu data rác thì xóa luôn
             localStorage.removeItem("auth_user");
          }
        }
      } catch (error) {
        console.error("Lỗi khôi phục session:", error);
        localStorage.removeItem("auth_user");
      } finally {
        // Dù thành công hay thất bại, cũng phải tắt loading đi
        setIsLoading(false);
      }
    };

    initAuth();

    // Lắng nghe event khi token được refresh bởi axiosClient interceptor
    const handleTokenRefreshed = (event: CustomEvent) => {
      const { accessToken, newRefreshToken } = event.detail;
      setUser((prevUser) => {
        if (!prevUser) return null;
        // Cập nhật token mới vào user state
        const updatedUser = {
          ...prevUser,
          token: accessToken,
        };
        // Lưu lại vào localStorage
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        // Setup auto refresh cho token mới
        setupAutoRefresh(accessToken);
        return updatedUser;
      });
    };

    window.addEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
    };
  }, []);

  // Sync user state với localStorage và setup auto refresh
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
        // Đảm bảo token luôn đồng bộ cho axiosClient dùng
        localStorage.setItem(StorageKeys.ACCESS_TOKEN, user.token);
        // Setup auto refresh token
        setupAutoRefresh(user.token);
      } else {
        // Nếu user null thì dọn dẹp sạch sẽ và clear timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        // CHÚ Ý: Không xóa ngay ở đây nếu đang loading, nhưng logic logout đã handle rồi
      }
    } catch {}

    // Cleanup khi component unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user?.token,
      isAdmin: user?.type === "admin",
      isLoading, // Export biến này ra ngoài

      checkUser: async (identifier: string) => {
        return await authService.checkUser(identifier);
      },

      login: async (identifier: string, otp: string) => {
        setIsLoading(true); // Bật loading khi đang xử lý
        try {
            const res = await authService.login({ identifier, otp });
            const contact = await enrichContactInfo(buildContactInfo(identifier));
            setUser({
                token: res.token,
                name: res.hoTen,
                customerId: res.maKhachHang,
                type: "customer",
                ...contact,
            });
        } finally {
            setIsLoading(false);
        }
      },

      register: async (identifier: string, name: string, otp: string) => {
        setIsLoading(true);
        try {
            const res = await authService.register({ identifier, hoTen: name, otp });
            const contact = await enrichContactInfo(buildContactInfo(identifier));
            setUser({
                token: res.token,
                name: res.hoTen,
                customerId: res.maKhachHang,
                type: "customer",
                ...contact,
            });
        } finally {
            setIsLoading(false);
        }
      },

      adminLogin: async (tenDangNhap: string, matKhau: string) => {
        setIsLoading(true);
        try {
            const res = await authService.adminLogin({ tenDangNhap, matKhau });
            const userType = res.maVaiTro === "VT001" ? "admin" : "staff";
            const contact = buildContactInfo(tenDangNhap);
            setUser({
                token: res.token,
                name: res.hoTen,
                employeeId: res.maNhanVien,
                maVaiTro: res.maVaiTro,
                tenVaiTro: res.tenVaiTro,
                type: userType,
                ...contact,
            });
        } finally {
            setIsLoading(false);
        }
      },

      logout: () => {
        // Clear refresh timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        setUser(null);
        localStorage.removeItem("auth_user");
        localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
        localStorage.removeItem(StorageKeys.REFRESH_TOKEN);
        // Có thể reload trang để clear sạch state của các component khác nếu cần
        // window.location.href = "/login"; 
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};