import api from '@/lib/api';

export const authService = {
    login: async (email: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const response = await api.post('/auth/tokens', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
        return response.data;
    },
    loginWithGoogle: async () => {
        const response = await api.get('/auth/google');
        return response.data;
    },
    loginWithGithub: async () => {
        const response = await api.get('/auth/github');
        return response.data;
    },
    verifySocialLogin: async (provider: "google" | "github", code: string) => {
        const response = await api.post(`/auth/verify/${provider}`, { code });
        return response.data;
    },
};
