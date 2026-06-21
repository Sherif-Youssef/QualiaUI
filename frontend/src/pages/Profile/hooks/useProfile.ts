import { useState, useEffect, useCallback } from 'react';
import { profileService } from '@/services/profile/profile';
import { adminService } from '@/services/admin/adminService';

interface UseProfileProps {
    userId?: string;
}

export const useProfile = ({ userId }: UseProfileProps) => {
    const [id, setId] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const [role, setRole] = useState<string | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        const getProfile = async () => {
            setIsLoading(true);
            try {
                const data = userId
                    ? await adminService.getUserById(userId)
                    : await profileService.getProfile();
                const p = data as any;
                setId(String(p.id));
                const resolvedFullName = p.fullName ||
                    (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : "") ||
                    (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : "User Account");
                setFullName(resolvedFullName);
                setUsername(p.username || p.user_name || "");
                setEmail(p.email || "");

                setRole(p.role || (p.isAdmin ? "Administrator" : "Member"));
                setEmailNotifications(p.emailNotifications ?? p.email_notifications ?? true);

                console.log("Profile loaded successfully:", {
                    name: resolvedFullName,
                    user: p.username,
                    email: p.email
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        getProfile();
    }, [userId]);

    const handleSaveAll = useCallback(async () => {
        setIsSaving(true);
        try {
            await profileService.updateProfile({
                id: id || "",
                fullName: fullName || "",
                role: role || "",
                emailNotifications: emailNotifications
            });
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    }, [id, fullName, role, emailNotifications]);

    return {
        fullName, setFullName,
        username,
        email,
        role,
        emailNotifications, setEmailNotifications,
        isLoading,
        isSaving,
        isPasswordModalOpen, setIsPasswordModalOpen,
        handleSaveAll
    };
};

