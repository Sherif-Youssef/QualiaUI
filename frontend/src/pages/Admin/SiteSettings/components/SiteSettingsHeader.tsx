import React from 'react';
import { Settings } from 'lucide-react';

export const SiteSettingsHeader: React.FC = () => {
    return (
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-3xl font-sans font-extrabold text-gray-900 tracking-tight">Site Settings</h2>
                    <p className="text-gray-500 font-medium">Manage global configurations and resources</p>
                </div>
            </div>
        </div>
    );
};
