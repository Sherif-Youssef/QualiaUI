import api from "@/lib/api";
import { UserProfile, UserDTO, UpdatePasswordForm } from "@/types";

const mapDTOToProfile = (data: UserDTO): UserProfile => ({
    fullName: `${data.first_name} ${data.last_name}`,
    email: data.email,
    avatarUrl: data.avatar_url,
    bannerUrl: data.banner_url,
    role: data.role || "User",
    isAdmin: data.is_admin,
    emailNotifications: data.email_notifications ?? true,
});

const mapProfileToDTO = (profile: Partial<UserProfile>): Partial<UserDTO> => {
    const dto: Partial<UserDTO> = {};

    if (profile.fullName !== undefined) {
        const names = profile.fullName.trim().split(/\s+/);
        dto.first_name = names[0] || "";
        dto.last_name = names.length > 1 ? names.slice(1).join(" ") : "";
    }
    if (profile.email !== undefined) dto.email = profile.email;
    if (profile.avatarUrl !== undefined) dto.avatar_url = profile.avatarUrl;
    if (profile.bannerUrl !== undefined) dto.banner_url = profile.bannerUrl;
    if (profile.role !== undefined) dto.role = profile.role;
    if (profile.isAdmin !== undefined) dto.is_admin = profile.isAdmin;
    if (profile.emailNotifications !== undefined) dto.email_notifications = profile.emailNotifications;

    return dto;
};

export const profileService = {
    getProfile: async (): Promise<UserProfile> => {
        try {
            const response = await api.get<UserDTO>('/profile');
            return mapDTOToProfile(response.data);
        }
        catch (error) {
            console.error("Error fetching profile:", error);
            throw error;
        }
    },

    updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
        try {
            const response = await api.put<UserDTO>('/profile', mapProfileToDTO(profile));
            return mapDTOToProfile(response.data);
        }
        catch (error) {
            console.error("Error updating profile:", error);
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
            console.error("Error updating avatar:", error);
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
            console.error("Error updating banner:", error);
            throw error;
        }
    }
};
