import React from 'react';
import { Play, ArrowLeft, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TestCaseDetailsHeaderProps {
    name: string;
    url?: string;
    status: string;
    isRunning: boolean;
    onRun: () => void;
    backUrl: string;
}

export const TestCaseDetailsHeader: React.FC<TestCaseDetailsHeaderProps> = ({
    name,
    url,
    status,
    isRunning,
    onRun,
    backUrl
}) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate(backUrl)}
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Test Suite
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-sans font-black text-gray-800 tracking-tight">{name}</h1>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'passed' ? 'bg-success/10 text-success' :
                                status === 'failed' ? 'bg-failure/10 text-failure' :
                                    status === 'running' ? 'bg-primary/10 text-primary' :
                                        'bg-gray-100 text-gray-500'
                            }`}>
                            {status}
                        </span>
                    </div>
                    {url && (
                        <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg w-fit">
                            <Globe className="w-4 h-4" />
                            <span className="text-sm font-medium">{url}</span>
                        </div>
                    )}
                </div>

                <Button
                    onClick={onRun}
                    disabled={isRunning}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 rounded-xl font-bold transition-all active:scale-95"
                >
                    {isRunning ? (
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    ) : (
                        <Play className="w-5 h-5 mr-3" />
                    )}
                    {isRunning ? "Running Test..." : "Run Test Case"}
                </Button>
            </div>
        </div>
    );
};
