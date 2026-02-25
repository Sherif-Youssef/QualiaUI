import api from "@/lib/api";
import { UpdatePasswordForm, PasswordDTO } from "@/types";

const mapPasswordToDTO = (form: UpdatePasswordForm): PasswordDTO => ({
    current_password: form.currentPassword,
    new_password: form.newPassword,
    confirm_password: form.confirmPassword,
});

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