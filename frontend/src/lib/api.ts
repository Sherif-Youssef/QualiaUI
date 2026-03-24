import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    if (token) {
        if (!config.headers) {
            config.headers = {} as any;
        }
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response) {
            console.error(`[API ERROR ${error.response.status}]:`, error.response.data);

            if (error.response.status === 401) {
                console.warn("Unauthorized: Token might be expired.");
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } else if (error.request) {
            console.error('[API NETWORK ERROR]: No response received.', error.request);
        } else {
            console.error('[API SETUP ERROR]:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;