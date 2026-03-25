import React from "react";
import { Camera, Image as ImageIcon, User } from 'lucide-react';

interface ProfileHeaderProps {
    bannerUrl: string | null;
    avatarUrl: string | null;
    fullName: string | null;
    role: string | null;
    isLoading: boolean;
    bannerInputRef: React.RefObject<HTMLInputElement>;
    avatarInputRef: React.RefObject<HTMLInputElement>;
    onBannerClick: () => void;
    onAvatarClick: () => void;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => void;
    isOwnProfile: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    bannerUrl,
    avatarUrl,
    fullName,
    role,
    isLoading,
    bannerInputRef,
    avatarInputRef,
    onBannerClick,
    onAvatarClick,
    onImageChange,
    isOwnProfile
}) => {
    return (
        <div className="mb-8">
            <div
                className="relative w-full h-40 md:h-64 rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-r from-primary/10 to-tertiary/10 border border-border"
                style={{
                    backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {isOwnProfile && (
                    <button
                        onClick={onBannerClick}
                        className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 md:bg-white/20 backdrop-blur-md hover:bg-white/30 text-foreground text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all border border-white/20 md:border-white/30 z-10"
                    >
                        <ImageIcon className="w-3.5 h-3.5 md:w-4 h-4" />
                        <span className="hidden sm:inline">Change Banner</span>
                        <span className="sm:hidden">Edit</span>
                    </button>
                )}
                <input
                    type="file"
                    ref={bannerInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => onImageChange(e, 'banner')}
                />
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6 px-4 md:px-8 -mt-20 md:-mt-24 relative z-20">
                <div className={`group relative h-32 w-32 md:h-40 md:w-40 rounded-full border-4 md:border-8 border-background bg-muted overflow-hidden shadow-xl transition-all ${isLoading ? 'animate-pulse' : ''}`}>
                    {avatarUrl && !isLoading ? (
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            className="h-full w-full object-cover transition-opacity duration-300"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-tertiary/20 text-primary font-sans font-bold text-4xl">
                            {fullName ? (
                                fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            ) : (
                                <User className="w-12 h-12 opacity-50" />
                            )}
                        </div>
                    )}

                    {isOwnProfile && !isLoading && (
                        <div
                            onClick={onAvatarClick}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                        >
                            <Camera className="text-white w-10 h-10" />
                        </div>
                    )}
                    <input
                        type="file"
                        ref={avatarInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => onImageChange(e, 'avatar')}
                    />
                </div>

                <div className="text-center md:text-left pb-1">
                    <h1 className="text-2xl md:text-headline-xl font-bold text-foreground">
                        {fullName || "User Name"}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                        {role || "No Role Specified"}
                    </p>
                </div>
            </div>
        </div>
    );
};
