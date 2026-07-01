import React from 'react';
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { SiteSettingsHeader } from './components/SiteSettingsHeader';
import { LLMManagement } from './components/LLMManagement';

export const SiteSettingsPage: React.FC = () => {
    return (
        <DashboardLayout
            header={<SiteSettingsHeader />}
            searchBar={<></>}
            content={
                <div className="mt-8">
                    <LLMManagement />
                </div>
            }
            modals={<></>}
        />
    );
};
