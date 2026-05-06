import React from 'react';
import { NavLink } from 'react-router-dom';

interface LandingNavProps {
}

export const LandingNav: React.FC<LandingNavProps> = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100/80">
            <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-gray-900 text-lg tracking-tight">QUALIA</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="nav-link text-sm text-gray-500 font-medium">Features</a>
                <a href="#demo" className="nav-link text-sm text-gray-500 font-medium">Demo</a>
                <a href="#faq" className="nav-link text-sm text-gray-500 font-medium">FAQ</a>
            </div>
            <NavLink
                to="/login"
                className="btn-cyan-glow text-white text-sm font-semibold px-5 py-2 rounded-full inline-flex items-center justify-center"
            >
                Sign In
            </NavLink>
        </nav>
    );
};
