import axiosClient from '../api/axiosClient';

// Nếu có interface MonAn thì thay 'any' bằng MonAn nhé
export const dishService = {
    // 1. Lấy danh sách món ăn (có lọc)
    getDishes: async (params?: { maDanhMuc?: string; searchString?: string }) => {
        // Axios tự động xử lý query string từ object params, không cần URLSearchParams nữa
        const response = await axiosClient.get<any[]>('/api/MonAnsAPI', { 
            params: params 
        });
        return response.data;
    },

    // 2. Lấy chi tiết món ăn
    getDish: async (id: string) => {
        const response = await axiosClient.get<any>(`/api/MonAnsAPI/${encodeURIComponent(id)}`);
        return response.data;
    },

    // 3. Tạo món ăn mới
    createDish: async (data: any) => { // Thay 'any' bằng interface nếu có
        const response = await axiosClient.post<any>('/api/MonAnsAPI', data);
        return response.data;
    },

    // 4. Upload ảnh (Thay thế hàm uploadImageFile cũ)
    uploadImage: async (file: File, maMonAn?: string) => {
        const formData = new FormData();
        formData.append('file', file); // Lưu ý: Check lại bên Backend API nhận key là 'file' hay 'image' nhé
        
        if (maMonAn) {
            formData.append('maMonAn', maMonAn);
        }

        // LƯU Ý: Ông nhớ thay đường dẫn '/api/Upload/Image' này bằng đúng đường dẫn API upload của ông nha
        const response = await axiosClient.post('/api/Upload/Image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // 5. Lấy danh mục
    getCategories: async () => {
        const response = await axiosClient.get<any[]>('/api/DanhMucAPI');
        return response.data;
    },
};

export default dishService;