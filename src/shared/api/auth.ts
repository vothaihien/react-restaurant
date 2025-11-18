import { request } from "../utils/api";

export const authApi = {
  checkUser: (identifier: string) =>
    request<{ userExists: boolean }>("/api/Auth/check-user", {
      method: "POST",
      body: { identifier },
    }),

  register: (payload: { identifier: string; hoTen: string; otp: string }) =>
    request<{ token: string; hoTen: string; maKhachHang: string }>(
      "/api/Auth/register",
      { method: "POST", body: payload }
    ),

  login: (payload: { identifier: string; otp: string }) =>
    request<{ token: string; hoTen: string; maKhachHang: string }>(
      "/api/Auth/login",
      { method: "POST", body: payload }
    ),
};
