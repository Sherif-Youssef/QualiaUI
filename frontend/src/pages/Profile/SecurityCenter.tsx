import React from "react";
import { Shield, Lock, Settings } from 'lucide-react';
import { ProfileCard } from "./ProfileCard";

interface SecurityCenterProps {
    twoFactorEnabled: boolean;
    onUpdatePassword: () => void;
    onTwoFactorClick: () => void;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({
    twoFactorEnabled,
    onUpdatePassword,
    onTwoFactorClick
}) => {
    return (
        <ProfileCard
            title="Security Center"
            description="Manage your account protection and authentication."
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
                <button
                    onClick={onTwoFactorClick}
                    className="w-full flex items-center justify-between p-3.5 md:p-4 rounded-xl hover:bg-muted transition-all text-sm font-bold group border border-transparent hover:border-border"
                >
                    <span className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground text-left">
                        <Shield className="w-4 h-4" />
                        Two-Factor Auth
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase ${twoFactorEnabled ? 'bg-success/10 text-success' : 'bg-failure/10 text-failure'
                        }`}>
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                </button>
            </div>
        </ProfileCard>
    );
};
