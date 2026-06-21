import React from "react";
import { Shield, Lock, Settings } from 'lucide-react';
import { ProfileCard } from "./ProfileCard";

interface SecurityCenterProps {
    onUpdatePassword: () => void;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({
    onUpdatePassword
}) => {
    return (
        <ProfileCard
            title="Security Center"
            description="Manage your account protection."
            icon={<Shield className="w-5 h-5 text-failure" />}
        >
            <div className="space-y-2">
                <button
                    onClick={onUpdatePassword}
                    className="w-full flex items-center justify-between p-3.5 md:p-4 rounded-xl hover:bg-muted transition-all text-sm font-bold group border border-transparent hover:border-border"
                >
                    <span className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground">
                        <Lock className="w-4 h-4" />
                        Update Password
                    </span>
                    <Settings className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform" />
                </button>
            </div>
        </ProfileCard>
    );
};

