import api from '@/lib/api';

export const authService = {
    login: async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/tokens', {
                username: email,
                password: password
            });
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },
    refreshToken: async () => {
        try {
            const response = await api.post('/auth/tokens/refresh');
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },
    checkStoredToken: async () => {
        const token = localStorage.getItem('token');
        if (!token) return false;
        try {
            const response = await api.get('/auth/me');
            return !!response.data;
        } catch (error) {
            return false;
        }
    }
};
