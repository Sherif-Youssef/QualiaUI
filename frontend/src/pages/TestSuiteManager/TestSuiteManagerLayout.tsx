import React from 'react';
import { TopNav } from '@/components/TopNav';

interface TestSuiteManagerLayoutProps {
    sidebar: React.ReactNode;
    content: React.ReactNode;
    modals: React.ReactNode;
}

export const TestSuiteManagerLayout: React.FC<TestSuiteManagerLayoutProps> = ({
    sidebar,
    content,
    modals
}) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden text-left">
            <TopNav />
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {sidebar}
                {content}
            </div>
            {modals}
        </div>
    );
};
