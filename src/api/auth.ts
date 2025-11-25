// api/auth.ts
import axiosClient from "./axiosClient";
import { StorageKeys } from "@/constants/StorageKeys";

// --- IMPORT TỪ FILE MODEL MỚI TẠO ---
import { CustomerAuthResponse, EmployeeAuthResponse } from "@/models/AuthModel";

export const authApi = {
  // Check User (Giữ nguyên)
  checkUser: async (identifier: string) => {
    const rawResponse = await axiosClient.post("/Auth/check-user", {
      identifier,
    });
    return rawResponse as unknown as { userExists: boolean };
  },

  // Register (Dùng CustomerAuthResponse)
  register: async (payload: {
    identifier: string;
    hoTen: string;
    otp: string;
  }): Promise<CustomerAuthResponse> => {
    const rawResponse = await axiosClient.post("/Auth/register", payload);

    // Ép kiểu sang CustomerAuthResponse
    const response = rawResponse as unknown as CustomerAuthResponse;

    // Lưu token
    localStorage.setItem(StorageKeys.ACCESS_TOKEN, response.token);
    if (response.refreshToken) {
      localStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
    }

    return response;
  },

  // Login (Dùng CustomerAuthResponse)
  login: async (payload: {
    identifier: string;
    otp: string;
  }): Promise<CustomerAuthResponse> => {
    const rawResponse = await axiosClient.post("/Auth/login", payload);

    // Ép kiểu sang CustomerAuthResponse
    const response = rawResponse as unknown as CustomerAuthResponse;

    // Lưu token
    localStorage.setItem(StorageKeys.ACCESS_TOKEN, response.token);
    if (response.refreshToken) {
      localStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
    }

    return response;
  },

  // AdminLogin (Dùng EmployeeAuthResponse)
  adminLogin: async (payload: {
    tenDangNhap: string;
    matKhau: string;
  }): Promise<EmployeeAuthResponse> => {
    const rawResponse = await axiosClient.post("/Auth/admin/login", payload);

    // Ép kiểu sang EmployeeAuthResponse
    const response = rawResponse as unknown as EmployeeAuthResponse;

    // Lưu token
    localStorage.setItem(StorageKeys.ACCESS_TOKEN, response.token);
    if (response.refreshToken) {
      localStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
    }

    return response;
  },
};
