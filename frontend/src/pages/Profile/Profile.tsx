import React, { useState, useRef, useEffect } from "react";
import { Settings } from 'lucide-react';
import { profileService } from "@/services/profile";
import { ImageCropModal } from "@/components/Modal/ImageCropModal";
import { UpdatePasswordModal } from "@/components/Modal/UpdatePasswordModal";
import { TwoFactorModal } from "@/components/Modal/TwoFactorModals/TwoFactorModal";

// Import sub-components directly to avoid circular dependency via index.ts
import { ProfileHeader } from "./ProfileHeader";
import { PersonalInfo } from "./PersonalInfo";
import { SitePreferences } from "./SitePreferences";
import { SecurityCenter } from "./SecurityCenter";
import { ProfileLayout } from "./ProfileLayout";

export const ProfilePage: React.FC = () => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string | null>(null);
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
                const profile = await profileService.getProfile();
                setFullName(profile.fullName);
                setEmail(profile.email);
                if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
                if (profile.bannerUrl) setBannerUrl(profile.bannerUrl);
                setRole(profile.role);
                setEmailNotifications(profile.emailNotifications);
                setTwoFactorEnabled(profile.twoFactorEnabled);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        }
        getProfile();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
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
    }

    const onCropComplete = (croppedFile: File) => {
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
    }

    const handleSaveAllByButton = async () => {
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
    }

    return (
        <ProfileLayout
            header={
                <ProfileHeader
                    bannerUrl={bannerUrl}
                    avatarUrl={avatarUrl}
                    fullName={fullName}
                    role={role}
                    isLoading={isLoading}
                    bannerInputRef={bannerInputRef}
                    avatarInputRef={avatarInputRef}
                    onBannerClick={() => bannerInputRef.current?.click()}
                    onAvatarClick={() => avatarInputRef.current?.click()}
                    onImageChange={handleImageChange}
                />
            }
            leftColumn={
                <>
                    <PersonalInfo
                        fullName={fullName}
                        email={email}
                        setFullName={setFullName}
                    />
                    <SitePreferences
                        emailNotifications={emailNotifications}
                        setEmailNotifications={setEmailNotifications}
                    />
                </>
            }
            rightColumn={
                <SecurityCenter
                    twoFactorEnabled={twoFactorEnabled}
                    onUpdatePassword={() => setIsPasswordModalOpen(true)}
                    onTwoFactorClick={() => setIsTwoFactorModalOpen(true)}
                />
            }
            footer={
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSaveAllByButton}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Settings className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            }
        >
            {tempImage && cropConfig && (
                <ImageCropModal
                    image={tempImage}
                    aspect={cropConfig.aspect}
                    cropShape={cropConfig.shape}
                    onCropComplete={onCropComplete}
                    onClose={() => {
                        setTempImage(null);
                        setCropConfig(null);
                    }}
                />
            )}

            {isPasswordModalOpen && (
                <UpdatePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
            )}

            {isTwoFactorModalOpen && (
                <TwoFactorModal
                    mode={twoFactorEnabled ? 'disable' : 'enable'}
                    onClose={() => setIsTwoFactorModalOpen(false)}
                    onSuccess={(process) => {
                        setTwoFactorEnabled(process === 'enabling');
                    }}
                />
            )}
        </ProfileLayout>
    );
};