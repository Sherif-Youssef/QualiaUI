import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TestCaseRunView } from './components/TestCaseRunView';
import { TestCaseRunVideoView } from './components/TestCaseRunVideoView';
import { TestCaseRunDetailsView } from './components/TestCaseRunDetailsView';
import { TopNav } from '@/components/TopNav';
import { LayoutGrid, Video, Info } from 'lucide-react';
import { useTestCaseRun } from './hooks/useTestCaseRun';
import { TestSuiteManagerLoading } from '../TestSuiteManager/TestSuiteManagerLoading';

export const TestCaseRunPage: React.FC = () => {
    const { projectId, suiteId, caseId, runId } = useParams<{ 
        projectId: string; 
        suiteId: string; 
        caseId: string; 
        runId: string 
    }>();

    const navigate = useNavigate();
    const location = useLocation();
    
    
    const searchParams = new URLSearchParams(location.search);
    const initialView = (searchParams.get('view') as 'steps' | 'video' | 'details') || 'steps';
    const [activeView, setActiveView] = useState<'steps' | 'video' | 'details'>(initialView);

    const {
        runDetails,
        isLoading,
    } = useTestCaseRun({ projectId, suiteId, caseId, runId });

    useEffect(() => {
        const view = new URLSearchParams(location.search).get('view') as 'steps' | 'video' | 'details';
        if (['steps', 'video', 'details'].includes(view)) {
            setActiveView(view);
        } else {
            setActiveView('steps');
        }
    }, [location.search]);

    const handleViewChange = (view: 'steps' | 'video' | 'details') => {
        setActiveView(view);
        navigate(`?view=${view}`, { replace: true });
    };

    if (isLoading) return <TestSuiteManagerLoading />;

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            <TopNav />
            
            <div className="bg-white border-b border-gray-100 shrink-0">
                <div className="px-2 pb-0">
                    <div className="flex gap-2 -mb-px">
                        <button
                            onClick={() => handleViewChange('steps')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'steps' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Steps
                            {activeView === 'steps' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                            )}
                        </button>
                        <button
                            onClick={() => handleViewChange('video')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'video' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Video className="w-4 h-4" />
                            Execution Video
                            {activeView === 'video' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                            )}
                        </button>
                        <button
                            onClick={() => handleViewChange('details')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeView === 'details' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Info className="w-4 h-4" />
                            Details
                            {activeView === 'details' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {activeView === 'steps' ? (
                    <TestCaseRunView 
                        projectId={projectId}
                        suiteId={suiteId}
                        caseId={caseId}
                        runId={runId}
                    />
                ) : activeView === 'video' ? (
                    <TestCaseRunVideoView 
                        videoUrl={runDetails?.video_url}
                        status={runDetails?.status}
                    />
                ) : activeView === 'details' ? (
                    <TestCaseRunDetailsView 
                        runDetails={runDetails}
                    />
                ) : null}
            </div>
        </div>
    );
};
