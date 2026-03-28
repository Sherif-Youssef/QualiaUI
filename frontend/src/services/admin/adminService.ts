import api, { ApiResponse } from "@/lib/api";
import { UserDTO } from "@/types/user";

export interface UserManagementDTO extends UserDTO {
    id: number | string;
    created_at?: string;
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
    createdAt?: string;
    status: 'active' | 'inactive';
}
export interface UserListResult {
    users: UserViewModel[];
    total: number;
}
const mapUserToViewModel = (dto: UserManagementDTO): UserViewModel => ({
    id: String(dto.id),
    firstName: dto.first_name || '',
    lastName: dto.last_name || '',
    username: dto.username || '',
    email: dto.email,
    role: dto.role || 'user',
    isAdmin: dto.is_admin || dto.role === 'admin',
    createdAt: dto.created_at,
    status: dto.is_active !== false ? 'active' : 'inactive'
});

export const adminService = {
    getAllUsers: async (offset = 0, limit = 8, username?: string): Promise<UserListResult> => {
        try {
            const response = await api.get<ApiResponse<UserManagementDTO>>('/users', {
                params: { offset, limit, username: username || undefined }
            });
            return {
                users: response.data.items.map(mapUserToViewModel),
                total: response.data.total_items
            };
        } catch (error) {
            throw error;
        }
    },

    getUserById: async (userId: string): Promise<UserViewModel> => {
        try {
            const response = await api.get<UserManagementDTO>(`/users/${userId}`);
            return mapUserToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },

    createUser: async (data: any): Promise<{ user: UserViewModel, temporaryPassword?: string }> => {
        try {
            const response = await api.post<UserManagementDTO & { temporary_password?: string }>('/users', data);
            return {
                user: mapUserToViewModel(response.data),
                temporaryPassword: response.data.temporary_password
            };
        } catch (error) {
            throw error;
        }
    },

    updateUser: async (userId: string, data: any): Promise<UserViewModel> => {
        try {
            const response = await api.put<UserManagementDTO>(`/users/${userId}`, data);
            return mapUserToViewModel(response.data);
        } catch (error) {
            throw error;
        }
    },

    deleteUser: async (userId: string): Promise<void> => {
        try {
            await api.delete(`/users/${userId}`);
        } catch (error) {
            throw error;
        }
    },

    regenerateTempPassword: async (userId: string): Promise<any> => {
        try {
            const response = await api.post(`/auth/users/${userId}/temporary-password/regenerate`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    filterUsers: (users: UserViewModel[], query: string): UserViewModel[] => {
        const lowerQuery = query.toLowerCase();
        return users.filter(u =>
            u.email.toLowerCase().includes(lowerQuery) ||
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(lowerQuery)
        );
    },

    searchUsers: async (query: string, limit: number = 5): Promise<UserViewModel[]> => {
        try {
            const result = await adminService.getAllUsers(0, limit, query);
            return result.users;
        } catch (error) {
            return [];
        }
    },

    formatError: (err: any, fallback: string): string => {
        const detail = err.response?.data?.detail;
        if (!detail) return fallback;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        }
        return fallback;
    }
};

