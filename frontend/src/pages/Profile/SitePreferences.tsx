import React from "react";
import { Settings, Bell } from 'lucide-react';
import { ProfileCard } from "./ProfileCard";

interface SitePreferencesProps {
    emailNotifications: boolean;
    setEmailNotifications: (enabled: boolean) => void;
}

export const SitePreferences: React.FC<SitePreferencesProps> = ({
    emailNotifications,
    setEmailNotifications
}) => {
    return (
        <ProfileCard
            title="Site Preferences"
            description="Control how you receive updates and notifications."
            icon={<Settings className="w-5 h-5 md:w-6 md:h-6" />}
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div className="text-left">
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
        </ProfileCard>
    );
};
