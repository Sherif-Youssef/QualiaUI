import React from 'react';
import { TopNav } from '@/components/TopNav';

interface ProfileLayoutProps {
    header: React.ReactNode;
    leftColumn: React.ReactNode;
    rightColumn: React.ReactNode;
    footer: React.ReactNode;
    children?: React.ReactNode;
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({
    header,
    leftColumn,
    rightColumn,
    footer,
    children
}) => {
    return (
        <div className="min-h-screen bg-gray-50 text-left">
            <TopNav />
            <main className="p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                {header}
                <div className="h-8 md:h-4"></div>
                <div className={`grid grid-cols-1 gap-8 ${rightColumn ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                    <div className={`${rightColumn ? 'lg:col-span-2' : 'lg:col-span-1'} space-y-6`}>
                        {leftColumn}
                    </div>
                    {rightColumn && (
                        <div className="space-y-6">
                            {rightColumn}
                        </div>
                    )}
                </div>
                {footer}
                {children}
            </main>
        </div>
    );

};
