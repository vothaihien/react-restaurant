export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const resolveDefaultBaseUrl = (): string => {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
        return envUrl.trim().replace(/\/+$/, '');
    }

    // if (typeof window !== 'undefined') {
    //     const { protocol, hostname, port } = window.location;
    //     // Nếu frontend đang chạy trên localhost thì ưu tiên domain nội bộ đã cấu hình sẵn
    //     const isLocalHost = !hostname || ['localhost', '127.0.0.1', '[::1]'].includes(hostname);

    //     // Nếu frontend đang chạy trên port 5555, dùng localhost:5555 cho backend
    //     if (isLocalHost && port === '5555') {
    //         return 'http://localhost:5555';
    //     }

    //     const targetHost = isLocalHost ? '192.168.100.47' : hostname;
    //     const defaultPort = protocol === 'https:' ? '7190' : '5134';
    //     return `${protocol}//${targetHost}:${defaultPort}`;
    // }

    return 'http://localhost:5555';
};

const BASE_URL = resolveDefaultBaseUrl();

async function request<T>(path: string, options?: { method?: HttpMethod; body?: any; token?: string }): Promise<T> {
    const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options?.token) headers['Authorization'] = `Bearer ${options.token}`;
    const res = await fetch(url, {
        method: options?.method || 'GET',
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
}

// API wrappers
export const Api = {
    createReservation: (data: {
        MaBan: string;
        HoTenKhach: string;
        SoDienThoaiKhach: string;
        ThoiGianDatHang: string;
        SoLuongNguoi: number;
        GhiChu?: string;
        MaNhanVien?: string;
        TienDatCoc?: number;
    }) => request<{ message: string; donHang: any }>('api/DatBanAPI/TaoDatBan', { method: 'POST', body: data }),

    updateOrderStatus: (maDonHang: string, maTrangThai: string) =>
        request<{ message: string }>(`/api/DatBanAPI/CapNhatTrangThai/${maDonHang}`, {
            method: 'PUT',
            body: maTrangThai
        }),

    getTables: () => request<any[]>('/api/BanAnsAPI'),
    getTablesByTime: (dateTime: string, soNguoi: number) =>
        request<any[]>(`/api/BanAnsAPI/GetStatusByTime?dateTime=${encodeURIComponent(dateTime)}&soNguoi=${soNguoi}`),

    getTangs: () => request<any[]>('/api/TangAPI'),

    getRevenueByMonth: (nam: number) => request<Array<{ thang: number; doanhThu: number }>>(`/api/Statistics/doanh-thu-theo-thang?nam=${nam}`),
    getMyBookings: (token: string) => request<any[]>('/api/BookingHistory/me', { token }),

    // Auth (OTP)
    checkUser: (identifier: string) => request<{ userExists: boolean }>(
        '/api/Auth/check-user',
        { method: 'POST', body: { identifier } }
    ),
    register: (payload: { identifier: string; hoTen: string; otp: string }) =>
        request<{ token: string; hoTen: string; maKhachHang: string }>(
            '/api/Auth/register',
            { method: 'POST', body: payload }
        ),
    login: (payload: { identifier: string; otp: string }) =>
        request<{ token: string; hoTen: string; maKhachHang: string }>(
            '/api/Auth/login',
            { method: 'POST', body: payload }
        ),

    // Dishes
    getDishes: (params?: { maDanhMuc?: string; searchString?: string }) => {
        const qs = new URLSearchParams();
        if (params?.maDanhMuc) qs.set('maDanhMuc', params.maDanhMuc);
        if (params?.searchString) qs.set('searchString', params.searchString);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return request<any[]>(`/api/MonAnsAPI${suffix}`);
    },
    getDish: (id: string) => request<any>(`/api/MonAnsAPI/${encodeURIComponent(id)}`),

    createDish: (data: {
        TenMonAn: string;
        MaDanhMuc?: string;
        IsShow?: boolean;
        HinhAnhUrls?: string[];
        PhienBanMonAns: Array<{
            TenPhienBan: string;
            Gia: number;
            MaTrangThai?: string;
            IsShow?: boolean;
            ThuTu?: number;
            CongThucNauAns: Array<{
                MaNguyenLieu: string;
                SoLuongCanDung: number;
            }>;
        }>;
    }) => request<any>('/api/MonAnsAPI', { method: 'POST', body: data }),

    uploadImage: async (file: File, maMonAn?: string): Promise<{ url: string; message: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const url = maMonAn
            ? `${BASE_URL}/api/MonAnsAPI/upload-image?maMonAn=${encodeURIComponent(maMonAn)}`
            : `${BASE_URL}/api/MonAnsAPI/upload-image`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload ảnh thất bại' }));
            throw new Error(error.message || 'Upload ảnh thất bại');
        }

        return await response.json();
    },

    // Categories
    getCategories: () => request<any[]>('/api/DanhMucAPI'),

    // Booking History (requires auth token)
    cancelBooking: (maDonHang: string, token: string) =>
        request<{ message: string }>(`/api/BookingHistory/cancel/${encodeURIComponent(maDonHang)}`, {
            method: 'POST',
            token
        }),

    // Orders
    createOrder: (data: {
        MaBan: string;
        MaKhachHang: string;
        MaNhanVien?: string;
        ChiTietDonHang: Array<{ MaPhienBan: string; SoLuong: number }>;
        GhiChu?: string;
    }) => request<{ message: string; donHang: any }>('/api/OrdersAPI', { method: 'POST', body: data }),

    getOrder: (maDonHang: string) => request<any>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}`),

    getOrderByTable: (maBan: string) => request<any>(`/api/OrdersAPI/by-table/${encodeURIComponent(maBan)}`),

    updateOrder: (maDonHang: string, data: {
        ChiTietDonHang: Array<{ MaPhienBan: string; SoLuong: number }>;
        GhiChu?: string;
    }) => request<{ message: string; donHang: any }>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}`, {
        method: 'PUT',
        body: data
    }),

    addItemToOrder: (maDonHang: string, item: { MaPhienBan: string; SoLuong: number }) =>
        request<{ message: string; donHang: any }>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}/add-item`, {
            method: 'POST',
            body: item
        }),

    completeOrder: (maDonHang: string) =>
        request<{ message: string; donHang: any }>(`/api/OrdersAPI/${encodeURIComponent(maDonHang)}/complete`, {
            method: 'POST'
        }),

    // Inventory
    getIngredients: () => request<any[]>('/api/InventoryAPI/ingredients'),

    getIngredient: (maNguyenLieu: string) => request<any>(`/api/InventoryAPI/ingredients/${encodeURIComponent(maNguyenLieu)}`),

    createIngredient: (data: {
        TenNguyenLieu: string;
        DonViTinh?: string;
        SoLuongTonKho?: number;
    }) => request<any>('/api/InventoryAPI/ingredients', { method: 'POST', body: data }),

    importInventory: (data: {
        MaNhanVien: string;
        MaNhaCungCap?: string;
        ChiTiet: Array<{ MaCungUng: string; SoLuong: number; GiaNhap: number }>;
        GhiChu?: string;
    }) => request<{ message: string; nhapHang: any }>('/api/InventoryAPI/import', {
        method: 'POST',
        body: data
    }),

    getInventoryTransactions: (fromDate?: string, toDate?: string) => {
        const qs = new URLSearchParams();
        if (fromDate) qs.set('fromDate', fromDate);
        if (toDate) qs.set('toDate', toDate);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return request<any[]>(`/api/InventoryAPI/transactions${suffix}`);
    },

    // Suppliers
    getSuppliers: () => request<any[]>('/api/SuppliersAPI'),

    // Employees
    getEmployees: () => request<any[]>('/api/EmployeesAPI'),

    getEmployee: (maNhanVien: string) => request<any>(`/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`),

    createEmployee: (data: {
        HoTen: string;
        TenDangNhap: string;
        MatKhau: string;
        Email?: string;
        SoDienThoai?: string;
        MaVaiTro: string;
        MaTrangThai?: string;
    }) => request<{ message: string; nhanVien: any }>('/api/EmployeesAPI', {
        method: 'POST',
        body: data
    }),

    updateEmployee: (maNhanVien: string, data: {
        HoTen?: string;
        Email?: string;
        SoDienThoai?: string;
        MaVaiTro?: string;
        MaTrangThai?: string;
    }) => request<{ message: string; nhanVien: any }>(`/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`, {
        method: 'PUT',
        body: data
    }),

    deleteEmployee: (maNhanVien: string) =>
        request<{ message: string }>(`/api/EmployeesAPI/${encodeURIComponent(maNhanVien)}`, {
            method: 'DELETE'
        }),

    getRoles: () => request<any[]>('/api/EmployeesAPI/roles'),
};

export { BASE_URL, request };

