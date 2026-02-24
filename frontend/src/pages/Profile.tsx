import { useState, useRef, useEffect } from "react";
import { User, Mail, Lock, Camera, Settings, Bell, Shield, Image as ImageIcon } from 'lucide-react';
import { profileService } from "@/services/profile";
import { ImageCropModal } from "@/components/Modal/ImageCropModal";
import { UpdatePasswordModal } from "@/components/Modal/UpdatePasswordModal";
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

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

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

            if (pendingAvatar) {
                promises.push(profileService.updateProfileAvatar(pendingAvatar));
            }
            if (pendingBanner) {
                promises.push(profileService.updateProfileBanner(pendingBanner));
            }
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
    useEffect(() => {
        const getProfile = async () => {
            setIsLoading(true);
            try {
                const profile = await profileService.getProfile();
                setFullName(profile.fullName);
                setEmail(profile.email);
                if (profile.avatarUrl) {
                    setAvatarUrl(profile.avatarUrl);
                }
                if (profile.bannerUrl) {
                    setBannerUrl(profile.bannerUrl);
                }
                setRole(profile.role);
                setEmailNotifications(profile.emailNotifications);
            }
            catch (error) {
                console.error("Error fetching profile:", error);
            }
            finally {
                setIsLoading(false);
            }
        }
        getProfile();
    }, []);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
                <div
                    className="relative w-full h-40 md:h-64 rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-r from-primary/10 to-tertiary/10 border border-border"
                    style={{
                        backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <button
                        onClick={() => bannerInputRef.current?.click()}
                        className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 md:bg-white/20 backdrop-blur-md hover:bg-white/30 text-foreground text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all border border-white/20 md:border-white/30 z-10"
                    >
                        <ImageIcon className="w-3.5 h-3.5 md:w-4 h-4" />
                        <span className="hidden sm:inline">Change Banner</span>
                        <span className="sm:hidden">Edit</span>
                    </button>
                    <input
                        type="file"
                        ref={bannerInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'banner')}
                    />
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6 px-4 md:px-8 -mt-20 md:-mt-24 relative z-20">
                    <div className={`group relative h-32 w-32 md:h-40 md:w-40 rounded-full border-4 md:border-8 border-background bg-muted overflow-hidden shadow-xl transition-all ${isLoading ? 'animate-pulse' : ''}`}>
                        {avatarUrl && !isLoading ? (
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                className="h-full w-full object-cover transition-opacity duration-300"
                                onError={() => setAvatarUrl(null)}
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

                        {!isLoading && (
                            <div
                                onClick={() => avatarInputRef.current?.click()}
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
                            onChange={(e) => handleImageChange(e, 'avatar')}
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
            <div className="h-8 md:h-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-2xl p-5 md:p-8 border border-border shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                            <div className="space-y-1">
                                <h2 className="text-xl md:text-headline-sm font-bold flex items-center gap-3">
                                    <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                    Personal Information
                                </h2>
                                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">Manage your public profile and personal details.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground/80 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                                        value={fullName || ""}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground/80 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                                        disabled={true}
                                        value={email || ""}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card rounded-2xl p-5 md:p-8 border border-border shadow-sm">
                        <h2 className="text-xl md:text-headline-sm font-bold flex items-center gap-3 mb-6">
                            <Settings className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            Site Preferences
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Email Notifications</p>
                                        <p className="text-xs text-muted-foreground">Receive updates about your projects</p>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${emailNotifications ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${emailNotifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-card rounded-2xl p-5 md:p-6 border border-border shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-3 px-1">
                            <Shield className="w-5 h-5 text-failure" />
                            Security Center
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="w-full flex items-center justify-between p-3.5 md:p-4 rounded-xl hover:bg-muted transition-all text-sm font-bold group border border-transparent hover:border-border"
                            >
                                <span className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground">
                                    <Lock className="w-4 h-4" />
                                    Update Password
                                </span>
                                <Settings className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3.5 md:p-4 rounded-xl hover:bg-failure/5 transition-all text-sm font-bold group border border-transparent hover:border-failure/10">
                                <span className="flex items-center gap-3 text-failure/80 group-hover:text-failure">
                                    <Shield className="w-4 h-4" />
                                    Two-Factor Auth
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-failure/10 text-failure font-black tracking-wider uppercase">Disabled</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
    );
};