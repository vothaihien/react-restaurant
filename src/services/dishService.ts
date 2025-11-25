import axiosClient from '../api/axiosClient';

// =============================================================================
// 1. ĐỊNH NGHĨA INTERFACE (Map theo MonAnDetailDTO.cs)
// =============================================================================

// Map với: CongThucNauAnDetailDTO
export interface CongThucNauAn {
    maCongThuc: string;
    maNguyenLieu: string;
    tenNguyenLieu: string;
    donViTinh?: string;
    soLuongCanDung: number;
}

// Map với: PhienBanMonAnDetailDTO
export interface PhienBanMonAn {
    maPhienBan: string;
    tenPhienBan: string;
    gia: number;
    maTrangThai: string;
    tenTrangThai: string;
    isShow: boolean;
    thuTu?: number;
    congThucNauAns: CongThucNauAn[];
}

// Map với: HinhAnhDTO
export interface HinhAnh {
    id: number;
    urlHinhAnh: string; // Backend viết hoa URLHinhAnh, nhưng JSON thường trả về camelCase (urlHinhAnh) tùy cấu hình
}

// Map với: MonAnDetailDTO (Dùng cho Get/Detail)
export interface MonAn {
    maMonAn: string;
    tenMonAn: string;
    maDanhMuc?: string;
    tenDanhMuc?: string;
    isShow: boolean;
    hinhAnhMonAns: HinhAnh[];
    phienBanMonAns: PhienBanMonAn[];
}

// Map với: CreateMonAnDTO (Dựa trên logic xử lý trong Controller của bạn)
export interface CreateMonAnRequest {
    tenMonAn: string;
    maDanhMuc: string;
    isShow: boolean;
    hinhAnhUrls: string[]; // List các URL ảnh đã upload
    phienBanMonAns: {
        maPhienBan?: string; // Nếu tạo mới thì null/empty
        tenPhienBan: string;
        maTrangThai: string;
        thuTu: number;
        gia: number; // Giá này sẽ lưu vào CongThucNauAn
        congThucNauAns: {
            maNguyenLieu: string;
            soLuongCanDung: number;
        }[];
    }[];
}

// =============================================================================
// 2. SERVICE IMPLEMENTATION
// =============================================================================

export const dishService = {
    // 1. Lấy danh sách món ăn
    // Controller: [HttpGet] public async Task<ActionResult<IEnumerable<MonAnDetailDTO>>> GetMonAns(...)
    getDishes: async (params?: { maDanhMuc?: string; searchString?: string }) => {
        const rawResponse = await axiosClient.get('/MonAnsAPI', { 
            params: params 
        });
        
        // Ép kiểu về mảng MonAn[]
        return rawResponse as unknown as MonAn[];
    },

    // 2. Lấy chi tiết món ăn
    // Controller: [HttpGet("{id}")] public async Task<ActionResult<MonAnDetailDTO>> GetMonAn(string id)
    getDish: async (id: string) => {
        const rawResponse = await axiosClient.get(`/MonAnsAPI/${encodeURIComponent(id)}`);
        
        // Ép kiểu về object MonAn
        return rawResponse as unknown as MonAn;
    },

    // 3. Tạo món ăn mới
    // Controller: [HttpPost] public async Task<ActionResult<MonAn>> CreateMonAn([FromBody] CreateMonAnDTO dto)
    createDish: async (data: CreateMonAnRequest) => {
        const rawResponse = await axiosClient.post('/MonAnsAPI', data);
        
        // Controller trả về CreatedAtAction (object MonAnDetailDTO)
        return rawResponse as unknown as MonAn;
    },

    // 4. Upload ảnh
    // Controller: [HttpPost("upload-image")] public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string? maMonAn = null)
    uploadImage: async (file: File, maMonAn?: string) => {
        const formData = new FormData();
        // Controller nhận param tên là "file" (IFormFile file)
        formData.append('file', file); 

        // Controller nhận maMonAn qua Query String ([FromQuery]), KHÔNG phải Body
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            params: maMonAn ? { maMonAn: maMonAn } : {}
        };

        const rawResponse = await axiosClient.post('/MonAnsAPI/upload-image', formData, config);
        
        // Backend trả về: { message: string, url: string }
        return rawResponse as unknown as { message: string; url: string };
    },

    // 5. Lấy danh mục (Giả định bạn có API này để fill dropdown)
    getCategories: async () => {
        // Bạn cần đảm bảo endpoint này đúng
        const rawResponse = await axiosClient.get('/DanhMucAPI'); 
        
        // Ép kiểu mảng danh mục
        return rawResponse as unknown as { maDanhMuc: string; tenDanhMuc: string }[];
    },
};

export default dishService;