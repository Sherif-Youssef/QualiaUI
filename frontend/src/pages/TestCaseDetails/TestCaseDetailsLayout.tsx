import React from 'react';
import { TopNav } from '@/components/TopNav';

interface TestCaseDetailsLayoutProps {
    sidebar?: React.ReactNode;
    content?: React.ReactNode;
    children?: React.ReactNode;
    modals?: React.ReactNode;
}

export function TestCaseDetailsLayout({
    sidebar,
    content,
    children,
    modals = null
}: TestCaseDetailsLayoutProps) {
    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden text-left">
            <TopNav />
            {children ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {sidebar}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {content}
                    </div>
                </div>
            )}
            {modals}
        </div>
    );
}
