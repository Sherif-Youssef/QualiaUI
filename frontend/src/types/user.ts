
export interface UserProfile {
    fullName: string;
    email: string;
    avatarUrl?: string;
    bannerUrl?: string;
    role: string;
    isAdmin: boolean;
    emailNotifications: boolean;
}

export interface UserDTO {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    banner_url?: string;
    role?: string;
    is_admin: boolean;
    email_notifications: boolean;
}


export interface PasswordDTO {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

export interface UpdatePasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
