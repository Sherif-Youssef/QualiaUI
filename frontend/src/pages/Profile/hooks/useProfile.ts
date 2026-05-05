import React, { useState, useRef, useEffect, useCallback } from 'react';
import { profileService } from '@/services/profile/profile';
import { adminService } from '@/services/admin/adminService';

interface UseProfileProps {
    userId?: string;
}

export const useProfile = ({ userId }: UseProfileProps) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const [role, setRole] = useState<string | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [tempImage, setTempImage] = useState<string | null>(null);
    const [cropConfig, setCropConfig] = useState<{ type: 'avatar' | 'banner', aspect: number, shape: 'round' | 'rect' } | null>(null);
    const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
    const [pendingBanner, setPendingBanner] = useState<File | null>(null);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const getProfile = async () => {
            setIsLoading(true);
            try {
                const data = userId
                    ? await adminService.getUserById(userId)
                    : await profileService.getProfile();
                const p = data as any;
                const resolvedFullName = p.fullName ||
                    (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : "") ||
                    (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : "User Account");
                setFullName(resolvedFullName);
                setUsername(p.username || p.user_name || "");
                setEmail(p.email || "");
                if (p.avatarUrl || p.avatar_url) setAvatarUrl(p.avatarUrl || p.avatar_url);
                if (p.bannerUrl || p.banner_url) setBannerUrl(p.bannerUrl || p.banner_url);

                setRole(p.role || (p.isAdmin ? "Administrator" : "Member"));
                setEmailNotifications(p.emailNotifications ?? p.email_notifications ?? true);
                setTwoFactorEnabled(p.twoFactorEnabled ?? p.two_factor_enabled ?? false);

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
        }
        getProfile();
    }, [userId]);

    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            setTempImage(URL.createObjectURL(file));
            setCropConfig({
                type,
                aspect: type === 'avatar' ? 1 : 5 / 1,
                shape: type === 'avatar' ? 'round' : 'rect'
            });
        }
        e.target.value = '';
    }, []);

    const onCropComplete = useCallback((croppedFile: File) => {
        if (!cropConfig) return;
        const previewUrl = URL.createObjectURL(croppedFile);
        if (cropConfig.type === 'avatar') {
            setAvatarUrl(previewUrl);
            setPendingAvatar(croppedFile);
        } else {
            setBannerUrl(previewUrl);
            setPendingBanner(croppedFile);
        }
        setTempImage(null);
        setCropConfig(null);
    }, [cropConfig]);

    const handleSaveAll = useCallback(async () => {
        setIsSaving(true);
        try {
            const promises = [];
            if (pendingAvatar) promises.push(profileService.updateProfileAvatar(pendingAvatar));
            if (pendingBanner) promises.push(profileService.updateProfileBanner(pendingBanner));

            promises.push(profileService.updateProfile({
                fullName: fullName || "",
                role: role || "",
                emailNotifications: emailNotifications
            }));

            await Promise.all(promises);
            setPendingAvatar(null);
            setPendingBanner(null);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    }, [pendingAvatar, pendingBanner, fullName, role, emailNotifications]);

    return {
        avatarUrl,
        bannerUrl,
        fullName, setFullName,
        username,
        email,
        role,
        emailNotifications, setEmailNotifications,
        isLoading,
        isSaving,
        tempImage, setTempImage,
        cropConfig, setCropConfig,
        isPasswordModalOpen, setIsPasswordModalOpen,
        isTwoFactorModalOpen, setIsTwoFactorModalOpen,
        twoFactorEnabled, setTwoFactorEnabled,
        bannerInputRef,
        avatarInputRef,
        handleImageChange,
        onCropComplete,
        handleSaveAll
    };
};
