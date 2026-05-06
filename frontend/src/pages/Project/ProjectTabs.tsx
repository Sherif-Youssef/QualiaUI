import React from 'react';
import { LayoutGrid, Users, Clock } from 'lucide-react';

export type ProjectView = 'suites' | 'team' | 'history';

interface ProjectTabsProps {
    activeView: ProjectView;
    onViewChange: (view: ProjectView) => void;
}

export const ProjectTabs: React.FC<ProjectTabsProps> = ({ activeView, onViewChange }) => {
    const tabs = [
        { id: 'suites' as const, label: 'Test Suites', icon: LayoutGrid },
        { id: 'team' as const, label: 'Manage Team', icon: Users },
        { id: 'history' as const, label: 'Execution History', icon: Clock },
    ];

    return (
        <div className="flex border-b border-gray-200">
            {tabs.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => onViewChange(id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === id ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Icon className="w-4 h-4" />
                    {label}
                    {activeView === id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                    )}
                </button>
            ))}
        </div>
    );
};
