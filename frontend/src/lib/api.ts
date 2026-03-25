import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface ApiResponse<T> {
    items: T[];
    total_items: number;
    offset: number;
    limit: number;
}

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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (error.response) {
            const status = error.response.status;

            if (status === 401 && !originalRequest._retry) {
                if (originalRequest.url.includes('/auth/tokens')) {
                    localStorage.removeItem('token');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    return Promise.reject(error);
                }
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(token => {
                            originalRequest.headers['Authorization'] = 'Bearer ' + token;
                            return api(originalRequest);
                        })
                        .catch(err => {
                            return Promise.reject(err);
                        });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const response = await axios.post<{ access_token: string }>('/api/v1/auth/tokens/refresh', {}, {
                        withCredentials: true
                    });

                    const newToken = response.data.access_token;
                    localStorage.setItem('token', newToken);

                    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    processQueue(null, newToken);

                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    localStorage.removeItem('token');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
