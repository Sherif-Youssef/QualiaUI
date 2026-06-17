import React, { useState } from 'react';
import { AuraBackground } from './AuraBackground';

interface HeroProps {
    onRun: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onRun }) => {
    const [testInput, setTestInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [testName, setTestName] = useState('');

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 px-4">
            <AuraBackground />

            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
                <div
                    className="feature-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-700 mb-8 border border-cyan-200/80"
                    style={{ background: 'rgba(6,182,212,0.07)', animationDelay: '0s' }}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    AI-Powered Web Testing
                </div>

                <h1 className="font-sans font-bold text-gray-900 mb-5 leading-tight" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', letterSpacing: '-0.03em' }}>
                    Test anything.{' '}
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #6366f1 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Describe it.
                    </span>
                    <br />
                    QUALIA handles the rest.
                </h1>

                <p className="text-gray-500 text-lg leading-relaxed mb-12 max-w-xl">
                    Generate, run, and validate end-to-end UI tests from plain English.
                    No scripts. No setup. Just results.
                </p>

                <div className="chat-container w-full max-w-2xl rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/80 p-4">
                    <textarea
                        rows={3}
                        value={testInput}
                        onChange={e => setTestInput(e.target.value)}
                        placeholder="Describe your test case… (e.g., Add a red shirt to the cart and proceed to checkout)"
                        className="w-full resize-none text-sm text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none leading-relaxed"
                    />

                    <div className="border-t border-gray-100 my-3" />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200/80 flex-1 min-w-0">
                                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <input
                                    type="text"
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    placeholder="Enter website URL"
                                    className="input-pill bg-transparent text-xs text-gray-700 placeholder-gray-400 border-none outline-none w-full min-w-0"
                                />
                            </div>

                            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200/80 flex-1 min-w-0">
                                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <input
                                    type="text"
                                    value={testName}
                                    onChange={e => setTestName(e.target.value)}
                                    placeholder="Test Case Name"
                                    className="input-pill bg-transparent text-xs text-gray-700 placeholder-gray-400 border-none outline-none w-full min-w-0"
                                />
                            </div>
                        </div>
                        <button
                            onClick={onRun}
                            className="btn-cyan-glow flex items-center justify-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                            </svg>
                            Run Test
                        </button>
                    </div>
                </div>

                <p className="mt-6 text-xs text-gray-400 font-medium tracking-wide uppercase">
                    Playwright-powered · Fully automated · Instant results
                </p>
            </div>
            
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
                <span className="text-xs text-gray-400 font-medium">Scroll</span>
                <div className="w-px h-8 bg-gradient-to-b from-gray-400 to-transparent" />
            </div>
        </section>
    );
};
