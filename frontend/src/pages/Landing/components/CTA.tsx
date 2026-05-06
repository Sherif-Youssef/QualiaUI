import React from 'react';
import { FadeIn } from './FadeIn';

interface CTAProps {
    onGetStarted: () => void;
}

export const CTA: React.FC<CTAProps> = ({ onGetStarted }) => {
    return (
        <section className="py-28 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-sky-600 to-indigo-600" />
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="cta-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.6" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#cta-grid)" />
                </svg>
            </div>
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20"
                style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)' }}
            />
            <FadeIn className="relative z-10 max-w-2xl mx-auto text-center">
                <h2 className="font-sans font-bold text-white text-4xl md:text-5xl mb-5" style={{ letterSpacing: '-0.025em' }}>
                    Ready to start testing?
                </h2>
                <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
                    Make UI testing effortless with QUALIA. Automate workflows, and unlock powerful testing features — all in one place.
                </p>
                <button
                    onClick={onGetStarted}
                    className="inline-flex items-center gap-2.5 bg-white text-cyan-700 font-semibold text-base px-8 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                    </svg>
                    Get Started Free
                </button>
            </FadeIn>
        </section>
    );
};
