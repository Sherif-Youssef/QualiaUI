import React, { useState } from 'react';
import { Camera, Globe, ChevronRight } from 'lucide-react';
import { TestStep, TestCase } from '@/types/test-case';
import { motion, AnimatePresence } from 'framer-motion';

interface TestStepSplitViewProps {
    testCase: TestCase;
    steps: TestStep[];
}

export const TestStepSplitView: React.FC<TestStepSplitViewProps> = ({ testCase, steps }) => {
    const [selectedStepId, setSelectedStepId] = useState<string | null>(steps[0]?.id || null);
    
    const selectedStep = steps.find(s => s.id === selectedStepId) || steps[0];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Info & Steps */}
            <div className="lg:col-span-5 space-y-6">
                {/* TestCase Meta Info */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 tracking-tight capitalize">Target URL</h3>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-100/50 transition-all">
                        <span className="text-xs font-bold text-gray-600 truncate mr-4">
                            {testCase.url || 'No URL specified'}
                        </span>
                        {testCase.url && (
                            <a 
                                href={testCase.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-white rounded-lg border border-gray-100 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Steps List */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-400 capitalize tracking-widest">Execution Steps</h3>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full">
                            {steps.length} Steps
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
                                    {step.number || index + 1}
                                </div>
                                <p className={`text-sm font-bold leading-relaxed transition-all ${
                                    selectedStepId === step.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                                }`}>
                                    {step.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Screenshot Viewer */}
            <div className="lg:col-span-7 sticky top-8">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-3">
                    <div className="relative aspect-video rounded-[2rem] bg-gray-50 overflow-hidden border border-gray-50 group">
                        <AnimatePresence mode="wait">
                            {selectedStep?.screenshot ? (
                                <motion.img
                                    key={selectedStep.id}
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    src={selectedStep.screenshot.startsWith('data:') ? selectedStep.screenshot : `data:image/png;base64,${selectedStep.screenshot}`}
                                    alt="Step Screenshot"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-4">
                                    <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                                        <Camera className="w-10 h-10 opacity-20" />
                                    </div>
                                    <span className="text-xs font-black capitalize tracking-widest opacity-40">No Reference Available</span>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Selected Step Label */}
                        {selectedStep && (
                            <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                                <span className="text-xs font-black text-white/90 capitalize tracking-widest">
                                    Step #{selectedStep.number || 'N/A'}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Caption / Context */}
                    {selectedStep && (
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-sm font-black text-gray-900 tracking-tight capitalize">Visual Verification</h4>
                            </div>
                            <p className="text-sm font-bold text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                                "{selectedStep.text}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
