import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, History, Settings, ChevronLeft } from 'lucide-react';
import { TestCaseRunView } from './components/TestCaseRunView';
import { TestCaseHistoryView } from './TestCaseHistoryView';
import { TestCaseManageView } from './TestCaseManageView';
import { TopNav } from '@/components/TopNav';
import { useTestCaseRun } from './hooks/useTestCaseRun';
import { Button } from '@/components/ui/button';

export const TestCasePage: React.FC = () => {
    const { projectId, suiteId, caseId } = useParams<{ projectId: string; suiteId: string; caseId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const initialView = (searchParams.get('view') as 'live' | 'history' | 'manage') || 'live';

    const [activeView, setActiveView] = useState<'live' | 'history' | 'manage'>(initialView);

    const {
        testCase,
        currentScreenshot, setCurrentScreenshot,
        currentUrl,
        zoomLevel, setZoomLevel,
        isLoading,
        error,
        isRunning,
        isAborting,
        isSuiteRun,
        isReadOnly,
        selectedStep,
        setSelectedStep,
        handleRunTest,
        handleAbort,
    } = useTestCaseRun({ projectId, suiteId, caseId });

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
            <div className="bg-white border-b border-gray-100 shrink-0 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/project/${projectId}/suite/${suiteId}`)}
                            className="h-12 w-12 rounded-[1.25rem] bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 shrink-0"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize">
                                {testCase?.name || 'Test Case'}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Test Case Session
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                {activeView === 'live' && isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 bg-white m-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                        <p className="text-gray-500 font-bold font-sans tracking-wide uppercase text-sm">Syncing Test Cases...</p>
                    </div>
                ) : activeView === 'live' && projectId && suiteId && caseId ? (
                    <TestCaseRunView
                        testCase={testCase}
                        currentScreenshot={currentScreenshot}
                        setCurrentScreenshot={setCurrentScreenshot}
                        currentUrl={currentUrl}
                        zoomLevel={zoomLevel}
                        setZoomLevel={setZoomLevel}
                        error={error}
                        isRunning={isRunning}
                        isAborting={isAborting}
                        isSuiteRun={isSuiteRun}
                        isReadOnly={isReadOnly}
                        selectedStep={selectedStep}
                        setSelectedStep={setSelectedStep}
                        handleRunTest={handleRunTest}
                        handleAbort={handleAbort}
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
