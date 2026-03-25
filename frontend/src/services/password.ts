import api from "@/lib/api";
import { UpdatePasswordForm } from "@/types/user";
import { mapPasswordToDTO } from "@/utils/mappers";

export const passwordService = {
  updatePassword: async (form: UpdatePasswordForm): Promise<void> => {
    try {
      await api.post("/auth/password/change", mapPasswordToDTO(form));
    } catch (error) {
      console.error("Failed to update password:", error);
      throw error;
    }
  },

  forgotPassword: async (email: string): Promise<string> => {
    try {
      await api.post("/forgot-password", { email });
      return "If the email exists, a reset password link will be sent to it.";
    } catch (error) {
      console.error("Failed to process forgot password:", error);
      throw error;
    }
  },
};