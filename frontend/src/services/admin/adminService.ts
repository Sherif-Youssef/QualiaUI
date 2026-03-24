import api from "@/lib/api";
import { UserDTO } from "@/types/user";

export interface UserManagementDTO extends UserDTO {
    id: string;
    created_at: string;
    last_login?: string;
}

export interface UserViewModel {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    isAdmin: boolean;
    createdAt: string;
    status: 'active' | 'inactive';
}

const mapUserToViewModel = (dto: UserManagementDTO): UserViewModel => ({
    id: dto.id,
    firstName: dto.first_name,
    lastName: dto.last_name,
    username: dto.username,
    email: dto.email,
    role: dto.role || 'user',
    isAdmin: dto.is_admin,
    createdAt: dto.created_at,
    status: dto.is_admin ? 'active' : 'active' // Simplified
});


export const adminService = {
    // NOTE: These endpoints must be implemented in the backend router!
    getAllUsers: async (): Promise<UserViewModel[]> => {
        try {
            const response = await api.get<{items: UserManagementDTO[]}>('/admin/users');
            return response.data.items.map(mapUserToViewModel);
        } catch (error) {
            throw error;
        }
    },
    
    getUserById: async (userId: string): Promise<UserViewModel> => {
        try {
            const response = await api.get<UserManagementDTO>(`/admin/users/${userId}`);
            return mapUserToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },
    
    createUser: async (data: any): Promise<UserViewModel> => {
        try {
            // Reusing auth/register logic if specific admin/users/ creation isn't preferred
            const response = await api.post<UserManagementDTO>('/admin/users', data);
            return mapUserToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },
    
    updateUser: async (userId: string, data: any): Promise<UserViewModel> => {
        try {
            const response = await api.put<UserManagementDTO>(`/admin/users/${userId}`, data);
            return mapUserToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },
    
    deleteUser: async (userId: string): Promise<void> => {
        try {
            await api.delete(`/admin/users/${userId}`);
        } catch (error) {
            throw error;
        }
    }
};
