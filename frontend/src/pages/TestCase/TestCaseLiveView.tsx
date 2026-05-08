import React from 'react';
import { TestCaseRunView } from './components/TestCaseRunView';

interface TestCaseLiveViewProps {
    projectId?: string;
    suiteId?: string;
    caseId?: string;
}

export const TestCaseLiveView: React.FC<TestCaseLiveViewProps> = ({
    projectId,
    suiteId,
    caseId
}) => {
    return (
        <TestCaseRunView 
            projectId={projectId}
            suiteId={suiteId}
            caseId={caseId}
            showBack={false}
        />
    );
};
