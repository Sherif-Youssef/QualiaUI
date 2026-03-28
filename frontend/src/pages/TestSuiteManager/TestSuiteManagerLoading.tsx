import React from 'react';
import { TopNav } from '@/components/TopNav';

export const TestSuiteManagerLoading: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden text-left">
            <TopNav />
            <div className="flex-1 flex flex-col items-center justify-center py-24 bg-white m-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                <p className="text-gray-500 font-bold font-sans tracking-wide uppercase text-sm">Syncing Test Cases...</p>
            </div>
        </div>
    );
};
