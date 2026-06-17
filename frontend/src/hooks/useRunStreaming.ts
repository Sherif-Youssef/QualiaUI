import { useState, useEffect, useRef, useCallback } from 'react';
import { runService } from '@/services/runService';
import { Scope } from "@/types";

interface UseRunStreamingProps {
    scope: Scope;
    runId: number | string | null;
    onStatusChange?: (event: any) => void;
    onStepUpdate?: (step: any) => void;
    onComplete?: () => void;
}

export const useRunStreaming = ({
    scope,
    runId,
    onStatusChange,
    onStepUpdate,
    onComplete
}: UseRunStreamingProps) => {
    const [isRunning, setIsRunning] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const callbacksRef = useRef({ onStatusChange, onStepUpdate, onComplete });

    useEffect(() => {
        callbacksRef.current = { onStatusChange, onStepUpdate, onComplete };
    }, [onStatusChange, onStepUpdate, onComplete]);

    const subscribe = useCallback((id: number) => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setIsRunning(true);
        console.log(`[Streaming] Subscribing to ${scope} run ${id}`);

        const eventSource = runService.subscribeToRunProgress(scope, id, (data: any) => {
            const { onStatusChange: cbStatus, onStepUpdate: cbStep, onComplete: cbComplete } = callbacksRef.current;

            if (data.type === 'STATUS_CHANGE') {
                const event = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                if (cbStatus) cbStatus(event);

                
                const eventElement = (event.element || '').toUpperCase();
                const scopeElement = scope.toUpperCase();

                if (eventElement === scopeElement && ['PASSED', 'FAILED', 'ABORTED', 'ERROR', 'SUCCESS', 'FAILURE'].includes(event.status?.toUpperCase())) {
                    console.log(`[Streaming] ${scope} run ${id} completed with status ${event.status}`);
                    eventSource.close();
                    setIsRunning(false);
                    if (cbComplete) cbComplete();
                }
            }

            if (data.type === 'TEST_STEP') {
                const stepData = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                if (cbStep) cbStep(stepData);
            }

            if (data.type === 'TEST_TERMINATION') {
                const terminationData = typeof data.event === 'string' ? JSON.parse(data.event) : data.event;
                if (cbStatus) cbStatus({
                    ...terminationData,
                    id: terminationData.testcase_id,
                    element: 'TESTCASE'
                });
            }
        });

        eventSourceRef.current = eventSource;
    }, [scope]); 

    useEffect(() => {
        if (runId && runId !== 'standalone') {
            const id = typeof runId === 'string' ? parseInt(runId) : runId;
            if (!isNaN(id)) {
                subscribe(id);
            }
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [runId, subscribe]);

    return {
        isRunning,
        stop: () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                setIsRunning(false);
            }
        }
    };
};
