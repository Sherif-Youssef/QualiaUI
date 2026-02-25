import api from "@/lib/api";
import { UserProfile, UserDTO } from "@/types";
import { mapUserToViewModel, mapProfileToDTO } from "@/utils/mappers";

export const profileService = {
    getProfile: async (): Promise<UserProfile> => {
        try {
            const response = await api.get<UserDTO>('/profile');
            return mapUserToViewModel(response.data);
        }
        catch (error) {
            throw error;
        }
    },

    updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
        try {
            const response = await api.put<UserDTO>('/profile', mapProfileToDTO(profile));
            return mapUserToViewModel(response.data);
        }
        catch (error) {
            throw error;
        }
    },

    updateProfileAvatar: async (avatar: File): Promise<{ avatarUrl: string }> => {
        try {
            const formData = new FormData();
            formData.append('avatar', avatar);
            const response = await api.put('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },

    updateProfileBanner: async (banner: File): Promise<{ bannerUrl: string }> => {
        try {
            const formData = new FormData();
            formData.append('banner', banner);
            const response = await api.put('/profile/banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }
};
