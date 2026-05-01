import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestStep } from '@/types/test-case';

interface StepDiagnosticModalProps {
    step: TestStep | null;
    onClose: () => void;
}

import { formatAction } from '@/utils/formatters';

export const StepDiagnosticModal: React.FC<StepDiagnosticModalProps> = ({ step, onClose }) => {
    return (
        <AnimatePresence>
            {step && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden flex flex-col"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Info className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Step Detail</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-xl hover:bg-gray-100 h-10 w-10"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </Button>
                        </div>

                        <div className="p-8 bg-gray-50/30">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Action Description</p>
                                <p className="text-lg font-bold text-gray-800 leading-relaxed italic">
                                    "{formatAction(step.text)}"
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 flex justify-end shrink-0 bg-white">
                            <Button
                                onClick={onClose}
                                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 h-12 font-black shadow-lg shadow-primary/10 transition-all active:scale-95"
                            >
                                GOT IT
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
