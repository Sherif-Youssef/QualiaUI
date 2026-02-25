import api from "@/lib/api";
import { UpdatePasswordForm } from "@/types";
import { mapPasswordToDTO } from "@/utils/mappers";

export const passwordService = {

    updatePassword: async (form: UpdatePasswordForm): Promise<void> => {
        try {
            await api.put('/profile/password', mapPasswordToDTO(form));
        } catch (error: any) {
            throw error;
        }
    },

    forgotPassword: async (email: string): Promise<string> => {
        try {
            await api.post('/forgot-password', { email });
            return 'If the email exists, a reset password link will be sent to it.';
        } catch (error: any) {
            throw error;
        }
    },
};