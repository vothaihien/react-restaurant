import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { StorageKeys } from '@/constants/StorageKeys';

const axiosClient: AxiosInstance = axios.create({
    baseURL: 'http://localhost:5555/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN); 
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response.data; // Lấy data trực tiếp
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Nếu lỗi 401 (Hết hạn) và chưa từng thử lại request này (tránh lặp vô tận)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Đánh dấu đã thử lại

            try {
                // 1. Lấy Refresh Token từ LocalStorage
                const refreshToken = localStorage.getItem(StorageKeys.REFRESH_TOKEN);
                
                if (!refreshToken) {
                    // Không có refresh token thì chịu, phải logout
                    throw new Error('No refresh token');
                }

                // 2. Gọi API để xin Token mới (Dùng axios thường để tránh lặp interceptor)
                const result = await axios.post('http://localhost:5555/api/Auth/refresh-token', {
                    refreshToken: refreshToken
                });

                const { accessToken, newRefreshToken } = result.data;

                // 3. Lưu Token mới vào LocalStorage
                localStorage.setItem(StorageKeys.ACCESS_TOKEN, accessToken);
                // Nếu backend trả về cả RefreshToken mới thì lưu luôn (Rotating Refresh Token)
                if (newRefreshToken) {
                     localStorage.setItem(StorageKeys.REFRESH_TOKEN, newRefreshToken);
                }

                // 3.1. Dispatch event để AuthContext biết token đã được refresh
                // AuthContext sẽ lắng nghe event này và cập nhật user state
                window.dispatchEvent(new CustomEvent('tokenRefreshed', { 
                    detail: { accessToken, newRefreshToken } 
                }));

                // 4. Gắn Token mới vào header của request cũ bị lỗi
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                // 5. Thực hiện lại request cũ
                return axiosClient(originalRequest);

            } catch (refreshError) {
                // Nếu Refresh cũng lỗi (hết hạn nốt hoặc bị thu hồi) -> Logout thật
                console.log('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
                localStorage.removeItem(StorageKeys.REFRESH_TOKEN);
                window.location.href = '/login';
                
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;

