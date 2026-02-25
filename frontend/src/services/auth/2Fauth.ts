import api from '@/lib/api';

export const twoFactorAuthService = {
    verify2FA: async (mfaToken: string, code: string) => {
        try {
            const response = await api.post('/auth/2fa/verify', {
                mfa_token: mfaToken,
                code: code
            });
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },
    get2FASetup: async () => {
        try {
            const response = await api.get('/auth/2fa/setup');
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    enable2FA: async (code: string, secret: string) => {
        try {
            const response = await api.post('/auth/2fa/enable', { code, secret });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    disable2FA: async (code: string) => {
        try {
            const response = await api.post('/auth/2fa/disable', { code });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },

}