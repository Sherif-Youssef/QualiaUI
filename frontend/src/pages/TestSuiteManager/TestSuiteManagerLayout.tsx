import React from 'react';
import { TopNav } from '@/components/TopNav';

interface TestSuiteManagerLayoutProps {
    sidebar: React.ReactNode;
    content: React.ReactNode;
    modals: React.ReactNode;
    error?: React.ReactNode;
}

export const TestSuiteManagerLayout: React.FC<TestSuiteManagerLayoutProps> = ({
    sidebar,
    content,
    modals,
    error
}) => {
    return (
        <div className="h-full bg-gray-50 flex flex-col overflow-hidden text-left">
            {error && <div className="px-6 pt-4">{error}</div>}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {sidebar}
                {content}
            </main>
            {modals}
        </div>
    );
};
