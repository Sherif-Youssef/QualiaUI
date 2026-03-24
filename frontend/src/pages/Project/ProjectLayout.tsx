import React from 'react';
import { TopNav } from '@/components/TopNav';

interface ProjectLayoutProps {
    header: React.ReactNode;
    searchBar: React.ReactNode;
    content: React.ReactNode;
    pagination?: React.ReactNode;
    modals: React.ReactNode;
}

export const ProjectLayout: React.FC<ProjectLayoutProps> = ({
    header,
    searchBar,
    content,
    pagination,
    modals
}) => {
    return (
        <div className="min-h-screen bg-gray-50 text-left">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="space-y-6">
                    {header}
                    {searchBar}
                    {content}
                    {pagination}
                </div>
            </main>
            {modals}
        </div>
    );
};
