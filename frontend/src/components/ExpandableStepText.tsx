import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableStepTextProps {
    text: string;
    maxLength?: number;
}

export const ExpandableStepText: React.FC<ExpandableStepTextProps> = ({ text, maxLength = 50 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const needsTruncation = text.length > maxLength;

    if (!needsTruncation) {
        return <p className="text-sm text-gray-700 font-medium leading-relaxed">{text}</p>;
    }

    return (
        <div className="flex-1 min-w-0">
            <p className={`text-sm text-gray-700 font-medium leading-relaxed transition-all duration-200 ${isExpanded ? '' : 'line-clamp-1'}`}>
                {text}
            </p>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1 mt-1 text-[10px] font-bold text-primary/60 hover:text-primary transition-colors"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="w-3 h-3" />
                        Show less
                    </>
                ) : (
                    <>
                        <ChevronDown className="w-3 h-3" />
                        Show more
                    </>
                )}
            </button>
        </div>
    );
};
