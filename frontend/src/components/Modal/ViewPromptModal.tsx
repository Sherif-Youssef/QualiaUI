import React from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from '../ui/button';

interface ViewPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: string;
}

export const ViewPromptModal: React.FC<ViewPromptModalProps> = ({ isOpen, onClose, prompt }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Prompt Instructions</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Natural language test definition</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 bg-white">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                        <p className="text-sm font-medium text-gray-600 leading-relaxed italic whitespace-pre-wrap">
                            {prompt}
                        </p>
                    </div>
                </div>
                <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end">
                    <Button
                        onClick={onClose}
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                    >
                        Got it
                    </Button>
                </div>
            </div>
        </div>
    );
};
