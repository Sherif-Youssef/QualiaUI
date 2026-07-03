import api from '@/lib/api';

let currentUserPromise: Promise<any> | null = null;

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
    logout: async () => {
        try {
            await api.post('/auth/logout');
        }
        catch (error) {
            console.error('Logout failed:', error);
        }
        finally {
            localStorage.removeItem('token');
        }
    },
    getCurrentUser: async () => {
        if (currentUserPromise) return currentUserPromise;

        currentUserPromise = (async () => {
            try {
                const response = await api.get('/auth/me');
                return response.data;
            } finally {
                setTimeout(() => {
                    currentUserPromise = null;
                }, 2000);
            }
        })();

        return currentUserPromise;
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
            const user = await authService.getCurrentUser();
            return !!user;
        } catch (error) {
            return false;
        }
    }
};
