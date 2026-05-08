import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, History, ChevronLeft } from 'lucide-react';
import { TestCaseLiveView } from './TestCaseLiveView';
import { TestCaseHistoryView } from './TestCaseHistoryView';
import { TopNav } from '@/components/TopNav';

export const TestCasePage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId: string; caseId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Check for view parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const initialView = searchParams.get('view') === 'history' ? 'history' : 'live';

    const [activeView, setActiveView] = useState<'live' | 'history'>(initialView);

    useEffect(() => {
        const view = new URLSearchParams(location.search).get('view');
        if (view === 'history') {
            setActiveView('history');
        } else {
            setActiveView('live');
        }
    }, [location.search]);

    const handleViewChange = (view: 'live' | 'history') => {
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
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {activeView === 'live' ? (
                    <TestCaseLiveView
                        projectId={projectId}
                        suiteId={suiteId}
                        caseId={caseId}
                    />
                ) : (
                    projectId && suiteId && caseId && (
                        <TestCaseHistoryView
                            projectId={projectId}
                            suiteId={suiteId}
                            caseId={caseId}
                        />
                    )
                )}
            </div>
        </div>
    );
};
