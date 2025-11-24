export const BASE_URL = 'http://localhost:5555';

export const request = async <T>(url: string, options: {
    method?: string;
    body?: any;
    token?: string;
} = {}): Promise<T> => {
    
    const headers = new Headers({
        'Content-Type': 'application/json',
    });

    if (options.token) {
        headers.append('Authorization', `Bearer ${options.token}`);
    }

    const config: RequestInit = {
        method: options.method || 'GET',
        headers: headers,
    };

    // Chỉ stringify body nếu là 'POST' hoặc 'PUT' và body tồn tại
    if (options.body && (options.method === 'POST' || options.method === 'PUT')) {
         // Xử lý riêng cho updateOrderStatus gửi string
         if (typeof options.body === 'string') {
            headers.set('Content-Type', 'application/json');
            config.body = JSON.stringify(options.body);
         } else {
            config.body = JSON.stringify(options.body);
         }
    }
    
    const response = await fetch(`${BASE_URL}${url}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API request failed' }));
        throw new Error(error.message || `Lỗi API: ${response.statusText}`);
    }

    // Xử lý trường hợp API trả về rỗng (ví dụ: 204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
};

// Hàm upload file chuyên dụng (dùng FormData)
export const uploadImageFile = async (file: File, maMonAn?: string): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const url = maMonAn
        ? `${BASE_URL}/api/MonAnsAPI/upload-image?maMonAn=${encodeURIComponent(maMonAn)}`
        : `${BASE_URL}/api/MonAnsAPI/upload-image`;

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Không set 'Content-Type', trình duyệt sẽ tự set đúng với FormData
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload ảnh thất bại' }));
        throw new Error(error.message || 'Upload ảnh thất bại');
    }

    return await response.json();
};
