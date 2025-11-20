// 1. Thông tin Nhà Cung Cấp (dùng cho Dropdown)
export interface NhaCungCap {
    maNhaCungCap: string;
    tenNhaCungCap: string;
    diaChi: string;
    soDienThoai: string;
}

// 2. Thông tin Nguyên Liệu lấy theo NCC (dùng cho Dropdown 2)
export interface NguyenLieuNCC {
    maCungUng: string;
    maNguyenLieu: string;
    tenNguyenLieu: string;
    donViTinh: string;
    giaGoiY: number;
}

// 3. Thông tin 1 dòng trong Giỏ hàng (Lưới nhập liệu)
export interface CartItem {
    maCungUng: string;
    maNguyenLieu: string;
    tenNguyenLieu: string;
    donViTinh: string;
    soLuong: number;
    giaNhap: number;
}

// 4. Thông tin hiển thị Lịch sử phiếu nhập
export interface PhieuNhapHistory {
    maNhapHang: string;
    ngayLap: string;
    ngayNhap: string | null;
    tenNhaCungCap: string;
    tenNhanVien: string;
    tongTien: number;
    maTrangThai: string; // 'MOI_TAO', 'DA_HOAN_TAT'...
    tenTrangThai: string;
}

// 5. Cấu trúc dữ liệu gửi đi (Payload) để Tạo/Sửa phiếu
export interface NhapKhoPayload {
    maNhanVien: string;
    maNhaCungCap: string;
    maTrangThai: string;
    chiTiet: {
        maCungUng: string;
        soLuong: number;
        giaNhap: number;
    }[];
}