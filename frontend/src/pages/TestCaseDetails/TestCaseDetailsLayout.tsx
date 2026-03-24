import React from 'react';
import { TopNav } from '@/components/TopNav';

interface TestCaseDetailsLayoutProps {
    sidebar: React.ReactNode;
    content: React.ReactNode;
    modals: React.ReactNode;
}

export const TestCaseDetailsLayout: React.FC<TestCaseDetailsLayoutProps> = ({
    sidebar,
    content,
    modals
}) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden text-left">
            <TopNav />
            <div className="flex-1 flex overflow-hidden">
                {sidebar}
                {content}
            </div>
            {modals}
        </div>
    );
};
