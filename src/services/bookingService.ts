import axiosClient from "src/api/axiosClient";

interface StaffBookingResponse {
    Success: boolean;
    Message: string;
    MaDonHang: string;
    KhuyenMai: string;
}

export const bookingService = {
    // 1. Đặt bàn thường
    createReservation: (data: any) => {
        return axiosClient.post<any>('/api/DatBanAPI/TaoDatBan', data);
    },

    // 2. API MỚI (Dành cho Nhân viên Lễ tân)
    createReservationByStaff: (data: {
        DanhSachMaBan: string[];
        HoTenKhach: string;
        SoDienThoaiKhach: string;
        Email?: string | null;
        ThoiGianDatHang: string;
        SoLuongNguoi: number;
        MaNhanVien: string;
    }) => {
        return axiosClient.post<StaffBookingResponse>('/api/DatBanAPI/staff/create', data);
    },

    // 3. Lấy lịch sử đặt bàn (Cần Token)
    getMyBookings: (token: string) => {
        return axiosClient.get<any[]>('/api/BookingHistory/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    },

    // 4. Hủy đặt bàn (Cần Token)
    cancelBooking: (maDonHang: string, token: string) => {
        return axiosClient.post<{ message: string }>(
            `/api/BookingHistory/cancel/${encodeURIComponent(maDonHang)}`,
            {}, 
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    },
};