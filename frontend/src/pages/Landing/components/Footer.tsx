import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="py-10 px-4 border-t border-gray-100 bg-white">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-gray-700 text-sm">QUALIA</span>
                </div>
                <p className="text-xs text-gray-400">© 2026 QUALIA UI. All rights reserved.</p>
                <div className="flex items-center gap-5">
                    <a href="#" className="text-xs text-gray-400 hover:text-cyan-600 transition-colors">Privacy</a>
                    <a href="#" className="text-xs text-gray-400 hover:text-cyan-600 transition-colors">Terms</a>
                    <a href="#" className="text-xs text-gray-400 hover:text-cyan-600 transition-colors">Contact</a>
                </div>
            </div>
        </footer>
    );
};
