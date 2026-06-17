import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, History, Settings } from 'lucide-react';
import { TestCaseRunView } from './components/TestCaseRunView';
import { TestCaseHistoryView } from './TestCaseHistoryView';
import { TestCaseManageView } from './TestCaseManageView';
import { TopNav } from '@/components/TopNav';

export const TestCasePage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId: string; caseId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const initialView = (searchParams.get('view') as 'live' | 'history' | 'manage') || 'live';

    const [activeView, setActiveView] = useState<'live' | 'history' | 'manage'>(initialView);

    useEffect(() => {
        const view = new URLSearchParams(location.search).get('view') as 'live' | 'history' | 'manage';
        if (view === 'history') {
            setActiveView('history');
        } else if (view === 'manage') {
            setActiveView('manage');
        } else {
            setActiveView('live');
        }
    }, [location.search]);

    const handleViewChange = (view: 'live' | 'history' | 'manage') => {
        setActiveView(view);
        navigate(`?view=${view}`, { replace: true });
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden text-left">
            <TopNav />
            <div className="bg-white border-b border-gray-100 shrink-0">
                <div className="px-2 pb-0">
                    <div className="flex gap-2 -mb-px">
                        <button
                            onClick={() => handleViewChange('live')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'live' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Live Session
                            {activeView === 'live' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                            )}
                        </button>
                        <button
                            onClick={() => handleViewChange('history')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'history' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            Execution History
                            {activeView === 'history' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                            )}
                        </button>
                        <button
                            onClick={() => handleViewChange('manage')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'manage' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            Manage
                            {activeView === 'manage' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {activeView === 'live' && projectId && suiteId && caseId ? (
                    <TestCaseRunView
                        projectId={projectId}
                        suiteId={suiteId}
                        caseId={caseId}
                    />
                ) : activeView === 'history' && projectId && suiteId && caseId ? (
                    <TestCaseHistoryView
                        projectId={projectId}
                        suiteId={suiteId}
                        caseId={caseId}
                    />
                ) : activeView === 'manage' && projectId && suiteId && caseId ? (
                    <TestCaseManageView
                        projectId={projectId}
                        suiteId={suiteId}
                        caseId={caseId}
                    />
                ) : null}
            </div>
        </div>
    );
};
