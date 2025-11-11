import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { Api } from '@/shared/utils/api';

type AuthUser = { token: string; name: string; customerId: string } | null;

interface AuthContextType {
    user: AuthUser;
    isAuthenticated: boolean;
    checkUser: (identifier: string) => Promise<{ userExists: boolean }>;
    login: (identifier: string, otp: string) => Promise<void>;
    register: (identifier: string, name: string, otp: string) => Promise<void>;
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
        checkUser: async (identifier: string) => {
            return await Api.checkUser(identifier);
        },
        login: async (identifier: string, otp: string) => {
            const res = await Api.login({ identifier, otp });
            setUser({ token: res.token, name: res.hoTen, customerId: res.maKhachHang });
        },
        register: async (identifier: string, name: string, otp: string) => {
            const res = await Api.register({ identifier, hoTen: name, otp });
            setUser({ token: res.token, name: res.hoTen, customerId: res.maKhachHang });
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


