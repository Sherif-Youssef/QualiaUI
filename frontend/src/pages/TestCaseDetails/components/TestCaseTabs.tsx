import React from 'react';
import { LayoutGrid, Clock } from 'lucide-react';

interface TestCaseTabsProps {
    activeView: 'steps' | 'history';
    setActiveView: (view: 'steps' | 'history') => void;
}

export const TestCaseTabs: React.FC<TestCaseTabsProps> = ({ activeView, setActiveView }) => {
    return (
        <div className="flex border-b border-gray-200">
            <button
                onClick={() => setActiveView('steps')}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold transition-colors relative ${activeView === 'steps' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                <LayoutGrid className="w-4 h-4" />
                Test Steps
                {activeView === 'steps' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
            </button>
            <button
                onClick={() => setActiveView('history')}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold transition-colors relative ${activeView === 'history' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                <Clock className="w-4 h-4" />
                Run History
                {activeView === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
            </button>
        </div>
    );
};
