import api from '@/lib/api';

export const authService = {
    login: async (email: string, password: string) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            const response = await api.post('/auth/tokens', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            return response.data;
        }
        catch (error: any) {
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
