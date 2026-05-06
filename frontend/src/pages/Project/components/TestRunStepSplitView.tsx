import React, { useState } from 'react';
import { Camera, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { TestStepRun } from '@/types/run';
import { motion, AnimatePresence } from 'framer-motion';

interface TestRunStepSplitViewProps {
    steps: TestStepRun[];
}

export const TestRunStepSplitView: React.FC<TestRunStepSplitViewProps> = ({ steps }) => {
    const [selectedStepId, setSelectedStepId] = useState<number | null>(steps[0]?.id || null);
    
    const selectedStep = steps.find(s => s.id === selectedStepId) || steps[0];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PASSED':
            case 'EXECUTED': return <CheckCircle2 className="w-4 h-4 text-success" />;
            case 'FAILED': return <XCircle className="w-4 h-4 text-failure" />;
            default: return <AlertCircle className="w-4 h-4 text-warning" />;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Steps List */}
            <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-400 capitalize tracking-widest">Execution Steps</h3>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full">
                            {steps.length} Steps Executed
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                onClick={() => setSelectedStepId(step.id)}
                                className={`p-6 cursor-pointer transition-all flex items-start gap-4 group ${
                                    selectedStepId === step.id ? 'bg-primary/[0.02]' : 'hover:bg-gray-50/50'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                                    selectedStepId === step.id 
                                        ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' 
                                        : 'bg-gray-50 text-gray-400 border border-gray-100'
                                }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className={`text-sm font-bold leading-relaxed transition-all ${
                                        selectedStepId === step.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                                    }`}>
                                        {step.recreation_prompt || 'Action performed'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(step.status)}
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {step.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Screenshot Viewer */}
            <div className="lg:col-span-7 sticky top-8 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-3">
                    <div className="relative aspect-video rounded-[2rem] bg-gray-50 overflow-hidden border border-gray-50 group">
                        <AnimatePresence mode="wait">
                            {selectedStep?.screenshot_after || selectedStep?.screenshot_before ? (
                                <motion.img
                                    key={selectedStep.id}
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    src={(selectedStep.screenshot_after || selectedStep.screenshot_before)!.startsWith('data:') 
                                        ? (selectedStep.screenshot_after || selectedStep.screenshot_before)! 
                                        : `data:image/png;base64,${selectedStep.screenshot_after || selectedStep.screenshot_before}`}
                                    alt="Step Result"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-4">
                                    <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                                        <Camera className="w-10 h-10 opacity-20" />
                                    </div>
                                    <span className="text-xs font-black capitalize tracking-widest opacity-40">No Evidence Available</span>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Selected Step Label */}
                        {selectedStep && (
                            <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                                <span className="text-xs font-black text-white/90 capitalize tracking-widest">
                                    Step Details
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {getStatusIcon(selectedStep.status)}
                            </div>
                        )}
                    </div>
                    
                    {/* Action Context */}
                    {selectedStep && (
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Info className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-sm font-black text-gray-900 tracking-tight capitalize">Action Details</h4>
                            </div>
                            <pre className="text-xs font-mono font-bold text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100 whitespace-pre-wrap leading-relaxed shadow-inner">
                                {selectedStep.recreation_prompt || 'No action data available'}
                            </pre>
                            
                            {selectedStep.error_message && (
                                <div className="mt-4 p-4 bg-failure/5 border border-failure/10 rounded-2xl">
                                    <p className="text-[10px] font-black text-failure/60 capitalize tracking-widest mb-1">Error Encountered</p>
                                    <p className="text-xs font-bold text-failure leading-relaxed">
                                        {selectedStep.error_message}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
