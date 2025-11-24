import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const axiosClient: AxiosInstance = axios.create({
    baseURL: 'http://localhost:5555/api', 
    headers: {
        'Content-Type': 'application/json',
    },
    // timeout: 10000,
});

axiosClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

export default axiosClient;