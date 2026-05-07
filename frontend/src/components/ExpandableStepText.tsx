import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableStepTextProps {
    text: string;
    maxLength?: number;
}

export const ExpandableStepText: React.FC<ExpandableStepTextProps> = ({ text, maxLength = 100 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const needsTruncation = text.length > maxLength;

    if (!needsTruncation) {
        return <p className="text-sm text-gray-700 font-bold leading-relaxed">{text}</p>;
    }

    return (
        <div className="flex-1 min-w-0">
            <div className="relative">
                <p className={`text-sm text-gray-700 font-bold leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {text}
                </p>
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
                )}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1 mt-1.5 text-[9px] font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-all active:scale-95 group"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="w-3 h-3 transition-transform group-hover:-translate-y-0.5" />
                        Show less
                    </>
                ) : (
                    <>
                        <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                        Show more
                    </>
                )}
            </button>
        </div>
    );
};
