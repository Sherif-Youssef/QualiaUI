import React from "react";
import { User, Mail } from 'lucide-react';
import { ProfileCard } from "./ProfileCard";

interface PersonalInfoProps {
    fullName: string | null;
    email: string | null;
    setFullName: (name: string) => void;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({
    fullName,
    email,
    setFullName
}) => {
    return (
        <ProfileCard
            title="Personal Information"
            description="Manage your public profile and personal details."
            icon={<User className="w-5 h-5 md:w-6 md:h-6" />}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground/80 ml-1">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-left"
                            value={fullName || ""}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground/80 ml-1 text-left">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="email"
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium disabled:text-gray-400 disabled:cursor-not-allowed text-left"
                            disabled={true}
                            value={email || ""}
                        />
                    </div>
                </div>
            </div>
        </ProfileCard>
    );
};
