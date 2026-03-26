export interface UserProfile {
    id: string;
    fullName: string;
    username: string;
    email: string;
    avatarUrl?: string;
    bannerUrl?: string;
    role: string;
    isAdmin: boolean;
    isActive: boolean;
    isTempPass: boolean;
    emailNotifications: boolean;
    twoFactorEnabled: boolean;
}

export interface UserDTO {
    id: number | string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    avatar_url?: string;
    banner_url?: string;
    role?: string;
    is_admin: boolean;
    is_active?: boolean;
    is_temp_pass?: boolean;
    email_notifications: boolean;
    two_factor_enabled: boolean;
}


export interface PasswordDTO {
    current_password: string;
    new_password: string;
}

export interface UpdatePasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
