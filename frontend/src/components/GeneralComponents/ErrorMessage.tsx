import React, { useEffect } from 'react';
import { XCircle, X } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
    onClose?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
    useEffect(() => {
        if (onClose) {
            const timer = setTimeout(onClose, 8000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    return (
        <div className="group relative mb-6 p-4 rounded-2xl bg-red-50/50 border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-black text-red-900 leading-snug">{message}</p>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                >
                    <X className="w-4 h-4" strokeWidth={3} />
                </button>
            )}
        </div>
    );
}
