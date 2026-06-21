import React from "react";
import { Settings } from 'lucide-react';
import { useParams } from "react-router-dom";
import { UpdatePasswordModal } from "@/components/Modal/UpdatePasswordModal";

import { ProfileHeader } from "./ProfileHeader";
import { PersonalInfo } from "./PersonalInfo";
import { SecurityCenter } from "./SecurityCenter";
import { ProfileLayout } from "./ProfileLayout";
import { useProfile } from "./hooks/useProfile";

export const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId?: string }>();

    const {
        fullName, setFullName,
        username,
        email,
        role,
        isLoading,
        isSaving,
        isPasswordModalOpen, setIsPasswordModalOpen,
        handleSaveAll
    } = useProfile({ userId });

    return (
        <ProfileLayout
            header={
                <ProfileHeader
                    fullName={fullName}
                    role={role}
                    isLoading={isLoading}
                />
            }
            leftColumn={
                <PersonalInfo
                    fullName={fullName}
                    username={username}
                    email={email}
                    setFullName={setFullName}
                    readOnly={!!userId}
                />
            }
            rightColumn={
                !userId ? (
                    <SecurityCenter
                        onUpdatePassword={() => setIsPasswordModalOpen(true)}
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
            {isPasswordModalOpen && (
                <UpdatePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
            )}
        </ProfileLayout>
    );
};
