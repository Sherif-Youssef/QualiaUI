import React, { useState } from 'react';
import { CheckCircle2, XCircle, StopCircle, Loader2, Play } from 'lucide-react';
import { TestCaseCard } from '@/components/TestCaseCard';
import { ScreenshotViewer } from '@/components/ScreenshotViewer';
import { ErrorMessage } from '@/components/GeneralComponents';
import { WorkspaceLayout } from '@/components/Layout/WorkspaceLayout';
import { TestCase, ActionStep } from '@/types';
import { Button } from '@/components/ui/button';
import { RunConfigurationModal } from '@/components/Modal/RunConfigurationModal';
import { ExpandableStepText } from '@/components/ExpandableStepText';

interface TestCaseRunViewProps {
    testCase: TestCase | null;
    currentScreenshot: string;
    setCurrentScreenshot: React.Dispatch<React.SetStateAction<string>>;
    currentUrl: string;
    zoomLevel: number;
    setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
    error: string | null;
    isRunning: boolean;
    isAborting: boolean;
    isSuiteRun: boolean;
    isReadOnly: boolean;
    selectedStep: ActionStep | null;
    setSelectedStep: React.Dispatch<React.SetStateAction<ActionStep | null>>;
    handleRunTest: (llmModelId?: number, options?: { useScreenshots: boolean; useVideo: boolean; timeout: number; shouldGroupActions: boolean }) => Promise<void>;
    handleAbort: () => Promise<void>;
}

export const TestCaseRunView: React.FC<TestCaseRunViewProps> = ({
    testCase,
    currentScreenshot,
    setCurrentScreenshot,
    currentUrl,
    zoomLevel,
    setZoomLevel,
    error,
    isRunning,
    isAborting,
    isSuiteRun,
    isReadOnly,
    selectedStep,
    setSelectedStep,
    handleRunTest,
    handleAbort,
}) => {
    const [isRunConfigModalOpen, setIsRunConfigModalOpen] = useState(false);


    return (
        <WorkspaceLayout
            error={error && <ErrorMessage message={error} />}
            sidebar={
                <aside className="w-full lg:w-[400px] xl:w-[450px] bg-white border-r border-border flex flex-col h-full overflow-hidden shadow-sm z-10 text-left">
                    <div className="px-6 py-6 border-b border-border bg-white space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-sans font-black text-gray-900 truncate tracking-tight">
                                {testCase?.name || 'Test Case Run'}
                            </h2>
                            <div className="flex items-center gap-2 shrink-0">
                                {!isSuiteRun && !isReadOnly && (
                                    <>
                                        {isRunning ? (
                                            <Button
                                                onClick={handleAbort}
                                                disabled={isAborting}
                                                variant="destructive"
                                                className="h-9 px-4 rounded-xl font-bold shadow-lg shadow-red-100 flex items-center gap-2 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
                                            >
                                                <StopCircle className="w-4 h-4" />
                                                {isAborting ? 'Aborting...' : 'Abort'}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => setIsRunConfigModalOpen(true)}
                                                className="h-9 px-4 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 text-white"
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                                Run
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {testCase && (
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const s = (testCase.status || '').toUpperCase();
                                    const isSuccess = ['PASSED', 'SUCCESS', 'EXECUTED'].includes(s);
                                    const isFailure = ['FAILED', 'FAILURE'].includes(s);
                                    const isError = s === 'ERROR';
                                    const isAborted = s === 'ABORTED';
                                    const isRunningStatus = s === 'RUNNING';

                                    const colors = isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
                                        (isFailure || isError) ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
                                            isAborted ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-slate-50' :
                                                isRunningStatus ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50' :
                                                    'bg-gray-50 text-gray-400 border-gray-100 shadow-gray-50';

                                    return (
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center gap-1.5 ${colors}`}>
                                            {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {isFailure && <XCircle className="w-3.5 h-3.5" />}
                                            {isError && <XCircle className="w-3.5 h-3.5" />}
                                            {isAborted && <StopCircle className="w-3.5 h-3.5" />}
                                            {isRunningStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            {s || 'Idle'}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {testCase?.terminationReason && (
                            <div className={`p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300 ${['passed', 'success', 'executed'].includes(testCase.status?.toLowerCase() || '')
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                : testCase.status?.toLowerCase() === 'aborted'
                                    ? 'bg-slate-50 border-slate-100 text-slate-800'
                                    : 'bg-rose-50 border-rose-100 text-rose-800'
                                }`}>
                                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
                                    Termination Reason
                                </h4>
                                <ExpandableStepText
                                    text={testCase.terminationReason}
                                    className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap text-current font-sans font-medium"
                                />
                            </div>
                        )}

                        {testCase && (
                            <TestCaseCard
                                testCase={testCase}
                                onStepClick={(step) => {
                                    setSelectedStep(step);
                                    if (step.screenshot) setCurrentScreenshot(step.screenshot);
                                }}
                                onStepTextChange={() => { }}
                                isReadOnly={true}
                                selectedStepId={selectedStep ? String(selectedStep.id) : undefined}
                            />
                        )}
                    </div>
                </aside>
            }
            content={
                <ScreenshotViewer
                    screenshot={currentScreenshot}
                    url={currentUrl}
                    selectedStep={selectedStep}
                    zoomLevel={zoomLevel}
                    onZoomIn={() => setZoomLevel(z => Math.min(z + 25, 200))}
                    onZoomOut={() => setZoomLevel(z => Math.max(z - 25, 50))}
                    onResetZoom={() => setZoomLevel(100)}
                />
            }
            modals={
                <>
                    <RunConfigurationModal
                        isOpen={isRunConfigModalOpen}
                        onClose={() => setIsRunConfigModalOpen(false)}
                        onConfirm={(llmModelId, options) => {
                            handleRunTest(llmModelId, options);
                            setIsRunConfigModalOpen(false);
                        }}
                        title={`Run ${testCase?.name}`}
                    />
                </>
            }
        />
    );
};
