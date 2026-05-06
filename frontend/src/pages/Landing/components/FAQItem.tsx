import React, { useState } from 'react';

interface FAQItemProps {
    question: string;
    answer: string;
    index: number;
}

export const FAQItem: React.FC<FAQItemProps> = ({ question, answer, index }) => {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="border border-gray-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-cyan-200 hover:shadow-sm"
            style={{ animationDelay: `${index * 0.08}s` }}
        >
            <button
                className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-cyan-50/30 transition-colors duration-200"
                onClick={() => setOpen(!open)}
            >
                <span className="font-semibold text-gray-800 text-base pr-4">{question}</span>
                <div
                    className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center transition-all duration-300"
                    style={{
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        background: open ? 'linear-gradient(135deg, #06b6d4, #0ea5e9)' : 'white',
                        borderColor: open ? 'transparent' : undefined,
                    }}
                >
                    <svg
                        className={`w-3.5 h-3.5 transition-colors duration-300 ${open ? 'text-white' : 'text-gray-500'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: open ? '300px' : '0px', opacity: open ? 1 : 0 }}
            >
                <div className="px-6 pb-5 pt-1 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                    {answer}
                </div>
            </div>
        </div>
    );
};
