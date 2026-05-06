import React, { useState } from 'react';
import { FadeIn } from './FadeIn';
// @ts-ignore
import qualiaDemo from '../../../assets/videos/qualiademo.mp4';

export const VideoDemo: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <section id="demo" className="py-24 px-4 bg-gradient-to-b from-white to-gray-50/60">
            <FadeIn className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <span className="inline-block text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
                        Product Demo
                    </span>
                    <h2 className="font-sans font-bold text-gray-900 text-4xl mb-4" style={{ letterSpacing: '-0.025em' }}>
                        See QUALIA in action
                    </h2>
                    <p className="text-gray-500 text-base max-w-md mx-auto">
                        Watch how QUALIA turns a one-line description into a full, automated test run in seconds.
                    </p>
                </div>

                <div className="video-container relative rounded-2xl overflow-hidden bg-gray-900 aspect-video border border-gray-200 shadow-2xl">
                    {isPlaying && (
                        <>
                            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center text-white/50 text-sm italic z-10">
                                Video file missing. Please check assets.
                            </div>
                            <video 
                                className="absolute inset-0 w-full h-full object-cover z-20"
                                controls
                                autoPlay
                                onEnded={() => setIsPlaying(false)}
                            >
                                <source src={qualiaDemo} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </>
                    )}

                    {!isPlaying && (
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 z-10"
                            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1a2e 50%, #0f172a 100%)' }}
                        >
                            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="video-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6,182,212,0.8)" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#video-grid)" />
                            </svg>

                            <div
                                className="absolute w-48 h-48 rounded-full opacity-20"
                                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.8) 0%, transparent 70%)' }}
                            />

                            <button
                                onClick={() => setIsPlaying(true)}
                                className="relative z-30 w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/30 hover:border-cyan-400 hover:bg-cyan-500/20 transition-all duration-300 group scale-100 hover:scale-110"
                                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
                            >
                                <svg
                                    className="w-6 h-6 text-white group-hover:text-cyan-300 transition-colors ml-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M5 3l14 9-14 9V3z" />
                                </svg>
                            </button>
                            <p className="relative z-30 mt-5 text-white/40 text-sm font-medium">Click to watch demo</p>
                        </div>
                    )}
                </div>
            </FadeIn>
        </section>
    );
};
