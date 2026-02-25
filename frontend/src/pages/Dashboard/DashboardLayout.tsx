import React from 'react';
import { TopNav } from '@/components/TopNav';

interface DashboardLayoutProps {
    header: React.ReactNode;
    metrics: React.ReactNode;
    charts: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    header,
    metrics,
    charts
}) => {
    return (
        <div className="min-h-screen bg-gray-50 text-left">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {header}
                    {metrics}
                    {charts}
                </div>
            </main>
        </div>
    );
};
