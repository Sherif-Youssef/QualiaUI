import api from '@/lib/api';

export const socialAuthService = {
    loginWithGoogle: async () => {
        try {
            const response = await api.get('/auth/google');
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    loginWithGithub: async () => {
        try {
            const response = await api.get('/auth/github');
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    verifySocialLogin: async (provider: "google" | "github", code: string) => {
        try {
            const response = await api.post(`/auth/verify/${provider}`, { code });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    login: async (provider: 'google' | 'github') => {
        if (provider === 'google') return socialAuthService.loginWithGoogle();
        return socialAuthService.loginWithGithub();
    }
}