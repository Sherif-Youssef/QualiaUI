import React from "react";
import { User } from 'lucide-react';

interface ProfileHeaderProps {
    fullName: string | null;
    role: string | null;
    isLoading: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    fullName,
    role,
    isLoading
}) => {
    return (
        <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm flex flex-col sm:flex-row items-center gap-6 mb-8 text-left">
            <div className={`h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-primary/20 to-tertiary/20 text-primary flex items-center justify-center font-sans font-bold text-2xl md:text-3xl border border-border shadow-inner ${isLoading ? 'animate-pulse' : ''}`}>
                {fullName ? (
                    fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                ) : (
                    <User className="w-8 h-8 opacity-50" />
                )}
            </div>
            <div className="text-center sm:text-left flex-1 space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {fullName || "User Name"}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider">
                        {role || "Member"}
                    </span>
                </div>
            </div>
        </div>
    );
};

