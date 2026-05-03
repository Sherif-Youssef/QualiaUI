import React from "react";
import { Settings } from 'lucide-react';
import { useParams } from "react-router-dom";
import { ImageCropModal } from "@/components/Modal/ImageCropModal";
import { UpdatePasswordModal } from "@/components/Modal/UpdatePasswordModal";
import { TwoFactorModal } from "@/components/Modal/TwoFactorModals/TwoFactorModal";

import { ProfileHeader } from "./ProfileHeader";
import { PersonalInfo } from "./PersonalInfo";
import { SitePreferences } from "./SitePreferences";
import { SecurityCenter } from "./SecurityCenter";
import { ProfileLayout } from "./ProfileLayout";
import { useProfile } from "./hooks/useProfile";

export const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId?: string }>();

    const {
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
    } = useProfile({ userId });

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
                    onBannerClick={() => !userId && bannerInputRef.current?.click()}
                    onAvatarClick={() => !userId && avatarInputRef.current?.click()}
                    onImageChange={handleImageChange}
                    isOwnProfile={!userId}
                />
            }
            leftColumn={
                <>
                    <PersonalInfo
                        fullName={fullName}
                        username={username}
                        email={email}
                        setFullName={setFullName}
                        readOnly={!!userId}
                    />

                    {!userId && (
                        <SitePreferences
                            emailNotifications={emailNotifications}
                            setEmailNotifications={setEmailNotifications}
                        />
                    )}
                </>
            }
            rightColumn={
                !userId ? (
                    <SecurityCenter
                        twoFactorEnabled={twoFactorEnabled}
                        onUpdatePassword={() => setIsPasswordModalOpen(true)}
                        onTwoFactorClick={() => setIsTwoFactorModalOpen(true)}
                    />
                ) : null
            }
            footer={
                !userId ? (
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSaveAll}
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
                ) : null
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