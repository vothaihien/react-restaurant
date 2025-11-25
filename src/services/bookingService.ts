<<<<<<< Updated upstream
import axiosClient from "src/api/axiosClient";
=======
import axiosClient from "@/api/axiosClient"; // Đảm bảo đường dẫn đúng
>>>>>>> Stashed changes

interface StaffBookingResponse {
    Success: boolean;
    Message: string;
    MaDonHang: string;
    KhuyenMai: string;
}

export const bookingService = {
    // 1. Đặt bàn thường
    createReservation: async (data: any) => {
        const rawResponse = await axiosClient.post('/DatBanAPI/TaoDatBan', data);
        // Ép kiểu để tránh lỗi TS
        return rawResponse as unknown as any; 
    },

    // 2. API MỚI (Dành cho Nhân viên Lễ tân)
    createReservationByStaff: async (data: {
        DanhSachMaBan: string[];
        HoTenKhach: string;
        SoDienThoaiKhach: string;
        Email?: string | null;
        ThoiGianDatHang: string;
        SoLuongNguoi: number;
        MaNhanVien: string;
    }) => {
        const rawResponse = await axiosClient.post('/DatBanAPI/staff/create', data);
        // Ép kiểu Double Casting
        return rawResponse as unknown as StaffBookingResponse;
    },

<<<<<<< Updated upstream
    // 3. Lấy lịch sử đặt bàn (Cần Token)
    getMyBookings: (token: string) => {
        return axiosClient.get<any[]>('/api/BookingHistory/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(res => res.data); // <--- THÊM ĐOẠN NÀY VÀO (Lấy ruột data ra)
=======
    // 3. Lấy lịch sử đặt bàn 
    // KHÔNG CẦN TRUYỀN TOKEN (axiosClient tự lo)
    getMyBookings: async () => {
        const rawResponse = await axiosClient.get('/BookingHistory/me');
        // Ép kiểu về mảng
        return rawResponse as unknown as any[];
>>>>>>> Stashed changes
    },

    // 4. Hủy đặt bàn
    // KHÔNG CẦN TRUYỀN TOKEN
    cancelBooking: async (maDonHang: string) => {
        const rawResponse = await axiosClient.post(
            `/BookingHistory/cancel/${encodeURIComponent(maDonHang)}`,
            {} // Body rỗng
        );
        // Ép kiểu
        return rawResponse as unknown as { message: string };
    },
};