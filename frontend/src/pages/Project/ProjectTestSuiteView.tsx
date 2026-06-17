import React from 'react';
import { TestSuite } from "@/types";
import { TestSuiteList } from './TestSuiteList';
import { TestSuiteEmptyState } from './TestSuiteEmptyState';

interface ProjectTestSuiteViewProps {
    suites: TestSuite[];
    isLoading: boolean;
    isTrulyEmpty: boolean;
    isSearchEmpty: boolean;
    canManageSuites: boolean;
    onAddSuite: () => void;
    onNavigate: (id: string) => void;
    onViewDetails: (suite: TestSuite, e: React.MouseEvent) => void;
    onEdit: (suite: TestSuite, e: React.MouseEvent) => void;
    onDelete: (id: string, name: string, e: React.MouseEvent) => void;
}

export const ProjectTestSuiteView: React.FC<ProjectTestSuiteViewProps> = ({
    suites,
    isLoading,
    isTrulyEmpty,
    isSearchEmpty,
    canManageSuites,
    onAddSuite,
    onNavigate,
    onViewDetails,
    onEdit,
    onDelete
}) => {
    if (isLoading && suites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading test suites...</p>
            </div>
        );
    }

    if (isTrulyEmpty) {
        return <TestSuiteEmptyState canManageSuites={canManageSuites} onCreate={onAddSuite} />;
    }

    return (
        <>
            <TestSuiteList
                suites={suites}
                onNavigate={onNavigate}
                canManageSuites={canManageSuites}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
            />
            {isSearchEmpty && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">No test suites match your search.</p>
                </div>
            )}
        </>
    );
};
