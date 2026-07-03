import api from "@/lib/api";
import { UpdatePasswordForm } from "@/types";
import { mapPasswordToDTO } from "@/utils/mappers";

export const passwordService = {
  updatePassword: async (form: UpdatePasswordForm): Promise<void> => {
    try {
      await api.post("/auth/password/change", mapPasswordToDTO(form));
    } catch (error) {
      console.error("Failed to update password:", error);
      throw error;
    }
  }
};
