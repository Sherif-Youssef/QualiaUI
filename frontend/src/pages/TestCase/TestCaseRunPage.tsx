import React from 'react';
import { useParams } from 'react-router-dom';
import { TestCaseRunView } from './components/TestCaseRunView';
import { TopNav } from '@/components/TopNav';

export const TestCaseRunPage: React.FC = () => {
    const { projectId, suiteId, caseId, runId } = useParams<{ 
        projectId: string; 
        suiteId: string; 
        caseId: string; 
        runId: string 
    }>();

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <TopNav />
            <TestCaseRunView 
                projectId={projectId}
                suiteId={suiteId}
                caseId={caseId}
                runId={runId}
            />
        </div>
    );
};
