import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableStepTextProps {
    text: string;
    className?: string;
}

export const ExpandableStepText: React.FC<ExpandableStepTextProps> = ({ text, className }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const checkOverflow = () => {
            const el = textRef.current;
            if (el) {
                if (!isExpanded) {
                    const isOverflowing = el.scrollHeight > el.clientHeight;
                    setHasOverflow(isOverflowing);
                }
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text, isExpanded]);

    const defaultClass = "text-sm text-gray-700 font-bold leading-relaxed";
    const combinedClass = className || defaultClass;

    return (
        <div className="flex-1 min-w-0">
            <div className="relative">
                <p
                    ref={textRef}
                    className={`${combinedClass} transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}
                >
                    {text}
                </p>
            </div>
            {(hasOverflow || isExpanded) && (
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
            )}
        </div>
    );
};
