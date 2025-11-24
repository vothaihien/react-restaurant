import { request } from "../utils/api";

// Helper để lấy token từ localStorage
const getToken = (): string | undefined => {
  try {
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      const user = JSON.parse(authUser);
      return user?.token;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

export const employeesApi = {
  // Employees
  getEmployees: () => request<any[]>("/api/EmployeesAPI", { token: getToken() }),

  getEmployee: (maNhanVien: string) =>
    request<any>(
      `/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`,
      { token: getToken() }
    ),

  createEmployee: (data: {
    HoTen: string;
    TenDangNhap: string;
    MatKhau: string;
    Email?: string;
    SoDienThoai?: string;
    MaVaiTro: string;
    MaTrangThai?: string;
  }) =>
    request<{ message: string; nhanVien: any }>(
      "/api/EmployeesAPI",
      {
        method: "POST",
        body: data,
        token: getToken(),
      }
    ),

  updateEmployee: (
    maNhanVien: string,
    data: {
      HoTen?: string;
      Email?: string;
      SoDienThoai?: string;
      MaVaiTro?: string;
      MaTrangThai?: string;
    }
  ) =>
    request<{ message: string; nhanVien: any }>(
      `/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`,
      {
        method: "PUT",
        body: data,
        token: getToken(),
      }
    ),

  deleteEmployee: (maNhanVien: string) =>
    request<{ message: string }>(
      `/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`,
      {
        method: "DELETE",
        token: getToken(),
      }
    ),

  getRoles: () => request<any[]>("/api/EmployeesAPI/roles", { token: getToken() }),
};


