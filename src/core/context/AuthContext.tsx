import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { authApi } from '@/shared/api/auth';

type AuthUser = 
    | { token: string; name: string; customerId: string; type: 'customer' }
    | { token: string; name: string; employeeId: string; maVaiTro: string; tenVaiTro: string; type: 'admin' }
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('auth_user');
            if (raw) setUser(JSON.parse(raw));
        } catch { }
    }, []);
    useEffect(() => {
        try {
            if (user) localStorage.setItem('auth_user', JSON.stringify(user));
            else localStorage.removeItem('auth_user');
        } catch { }
    }, [user]);

    const value = useMemo<AuthContextType>(() => ({
        user,
        isAuthenticated: !!user?.token,
        isAdmin: user?.type === 'admin',
        checkUser: async (identifier: string) => {
            return await authApi.checkUser(identifier);
        },
        login: async (identifier: string, otp: string) => {
            const res = await authApi.login({ identifier, otp });
            setUser({ 
                token: res.token, 
                name: res.hoTen, 
                customerId: res.maKhachHang,
                type: 'customer'
            });
        },
        register: async (identifier: string, name: string, otp: string) => {
            const res = await authApi.register({ identifier, hoTen: name, otp });
            setUser({ 
                token: res.token, 
                name: res.hoTen, 
                customerId: res.maKhachHang,
                type: 'customer'
            });
        },
        adminLogin: async (tenDangNhap: string, matKhau: string) => {
            const res = await authApi.adminLogin({ tenDangNhap, matKhau });
            setUser({
                token: res.token,
                name: res.hoTen,
                employeeId: res.maNhanVien,
                maVaiTro: res.maVaiTro,
                tenVaiTro: res.tenVaiTro,
                type: 'admin'
            });
        },
        logout: () => setUser(null)
    }), [user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};


