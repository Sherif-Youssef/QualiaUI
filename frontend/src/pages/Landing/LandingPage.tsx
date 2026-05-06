import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingNav } from './components/LandingNav';
import { Hero } from './components/Hero';
import { VideoDemo } from './components/VideoDemo';
import { Features } from './components/Features';
import { CTA } from './components/CTA';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { InteractiveCursorCanvas } from './components/InteractiveCursorCanvas';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-body overflow-x-hidden">
            <style>{`
                @keyframes aura-pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
                    50% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.55; }
                }
                @keyframes orb-drift-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(40px, 30px) scale(1.08); }
                    66% { transform: translate(-20px, 50px) scale(0.95); }
                }
                @keyframes orb-drift-2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    40% { transform: translate(-50px, -40px) scale(1.1); }
                    70% { transform: translate(30px, -20px) scale(0.92); }
                }
                @keyframes orb-drift-3 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-30px, 40px); }
                }
                @keyframes particle-float {
                    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
                    33% { transform: translateY(-14px) translateX(6px); opacity: 1; }
                    66% { transform: translateY(-6px) translateX(-8px); opacity: 0.7; }
                }
                @keyframes badge-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                }
                .btn-cyan-glow {
                    background: linear-gradient(135deg, #06b6d4, #0ea5e9);
                    box-shadow: 0 4px 20px rgba(6,182,212,0.35);
                    transition: all 0.25s ease;
                }
                .btn-cyan-glow:hover {
                    background: linear-gradient(135deg, #0891b2, #0284c7);
                    box-shadow: 0 6px 28px rgba(6,182,212,0.55), 0 0 0 3px rgba(6,182,212,0.12);
                    transform: translateY(-1px);
                }
                .btn-cyan-glow:active {
                    transform: translateY(0px);
                }
                .chat-container {
                    box-shadow: 0 8px 48px rgba(6,182,212,0.12), 0 2px 16px rgba(0,0,0,0.06);
                    transition: box-shadow 0.3s ease;
                }
                .chat-container:focus-within {
                    box-shadow: 0 12px 56px rgba(6,182,212,0.22), 0 2px 20px rgba(0,0,0,0.08);
                }
                .input-pill {
                    transition: all 0.2s ease;
                }
                .input-pill:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(6,182,212,0.3);
                }
                .nav-link {
                    transition: color 0.2s ease;
                }
                .nav-link:hover { color: #06b6d4; }
                .video-container {
                    box-shadow: 0 20px 80px rgba(6,182,212,0.12), 0 4px 24px rgba(0,0,0,0.08);
                }
                .feature-chip {
                    animation: badge-float 3s ease-in-out infinite;
                }
            `}</style>

            <LandingNav />

            <Hero onRun={() => navigate('/login')} />

            <VideoDemo />

            <Features />

            <CTA onGetStarted={() => navigate('/login')} />

            <InteractiveCursorCanvas />

            <FAQ />

            <Footer />
        </div>
    );
};
