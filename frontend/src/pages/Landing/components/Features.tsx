import React from 'react';
import { FadeIn } from './FadeIn';

export const Features: React.FC = () => {
    return (
        <section id="features" className="py-24 px-4 bg-white">
            <FadeIn className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
                        Why QUALIA
                    </span>
                    <h2 className="font-sans font-bold text-gray-900 text-4xl" style={{ letterSpacing: '-0.025em' }}>
                        Built for the way teams actually work
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: (
                                <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            ),
                            title: 'AI Test Generation',
                            description: 'Describe any user flow in plain English and QUALIA instantly generates a complete, runnable test suite.',
                        },
                        {
                            icon: (
                                <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            ),
                            title: 'Instant Execution',
                            description: 'Tests run in a real Chromium browser. Visual screenshots captured at every step. Results in seconds.',
                        },
                        {
                            icon: (
                                <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            ),
                            title: 'Visual Reports',
                            description: 'Get rich, step-by-step reports with annotated screenshots so you always know exactly what passed or failed.',
                        },
                    ].map((feature, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="group p-6 rounded-2xl border border-gray-200/80 hover:border-cyan-200 hover:shadow-lg transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-cyan-50/30">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-cyan-100 group-hover:border-cyan-200 transition-colors"
                                    style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(14,165,233,0.06))' }}
                                >
                                    {feature.icon}
                                </div>
                                <h3 className="font-sans font-semibold text-gray-900 text-base mb-2">{feature.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </FadeIn>
        </section>
    );
};
