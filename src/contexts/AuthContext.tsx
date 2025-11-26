import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { authApi } from "@/api/auth";
import { StorageKeys } from "@/constants/StorageKeys"; // <-- 1. Import thêm cái này


  type EmployeeUser = {
    token: string;
    name: string;
    employeeId: string;
    maVaiTro: string;
    tenVaiTro: string;
    // Thêm 'staff' vào đây
    type: "admin" | "staff"; 
}

type AuthUser =
  | { token: string; name: string; customerId: string; type: "customer" }
  | EmployeeUser // Sử dụng kiểu đã định nghĩa
  | null;

interface AuthContextType {
  user: AuthUser;
  isAuthenticated: boolean;
  isAdmin: boolean;
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

  // Load user từ localStorage khi F5
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // Sync user state với localStorage
  useEffect(() => {
    try {
      if (user) localStorage.setItem("auth_user", JSON.stringify(user));
      else localStorage.removeItem("auth_user");
    } catch {}
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user?.token,
      isAdmin: user?.type === "admin",

      checkUser: async (identifier: string) => {
        return await authApi.checkUser(identifier);
      },

      login: async (identifier: string, otp: string) => {
        const res = await authApi.login({ identifier, otp });
        // Mapping dữ liệu: maKhachHang -> customerId (Để khớp với giao diện của bạn)
        setUser({
          token: res.token,
          name: res.hoTen,
          customerId: res.maKhachHang,
          type: "customer",
        });
      },

      register: async (identifier: string, name: string, otp: string) => {
        const res = await authApi.register({ identifier, hoTen: name, otp });
        setUser({
          token: res.token,
          name: res.hoTen,
          customerId: res.maKhachHang,
          type: "customer",
        });
      },

      adminLogin: async (tenDangNhap: string, matKhau: string) => {
        const res = await authApi.adminLogin({ tenDangNhap, matKhau });
        const userType = res.maVaiTro === 'VT001' ? 'admin' : 'staff'
        setUser({
          token: res.token,
          name: res.hoTen,
          employeeId: res.maNhanVien,
          maVaiTro: res.maVaiTro,
          tenVaiTro: res.tenVaiTro,
          type: userType,
        });
      },

      // --- 2. SỬA LẠI HÀM LOGOUT ---
      logout: () => {
        // Xóa state user (useEffect sẽ tự xóa 'auth_user' trong localStorage)
        setUser(null);

        // QUAN TRỌNG: Phải xóa Token của axiosClient để lần sau gọi API không bị dính token cũ
        localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
        localStorage.removeItem(StorageKeys.REFRESH_TOKEN);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
