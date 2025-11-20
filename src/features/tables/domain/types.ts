// 1. Định nghĩa Enum trạng thái bàn (để dùng cho chuẩn)
export enum TableStatus {
    Empty = 'Trống',
    Occupied = 'Đang phục vụ',
    Reserved = 'Đã đặt',
    Maintenance = 'Bảo trì'
}

// 2. Định nghĩa Interface cho đối tượng Bàn
export interface Table {
    id: string;         // Mapping từ maBan
    name: string;       // Mapping từ tenBan
    capacity: number;   // Mapping từ sucChua
    status: string;     // Mapping từ tenTrangThai (API trả về chuỗi)
    maTang: string;     // Mapping từ maTang
    orderId?: string | null; // Có thể null nếu bàn trống
}