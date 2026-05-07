import React, { useState } from 'react';
import { ProjectsLayout } from "@/pages/Projects/ProjectsLayout";
import { SiteSettingsHeader } from './components/SiteSettingsHeader';
import { LLMManagement } from './components/LLMManagement';
import { Cpu, Settings } from 'lucide-react';

export const SiteSettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'llm' | 'general'>('llm');

    const tabs = [
        { id: 'llm', label: 'LLM Management', icon: Cpu },
        // { id: 'general', label: 'General Settings', icon: Settings },
    ];

    return (
        <ProjectsLayout
            header={<SiteSettingsHeader />}
            searchBar={
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            }
            content={
                <div className="mt-8">
                    {activeTab === 'llm' && <LLMManagement />}
                    {/* {activeTab === 'general' && <div>General Settings Content</div>} */}
                </div>
            }
            modals={<></>}
        />
    );
};
