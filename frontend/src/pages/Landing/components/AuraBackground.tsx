import React from 'react';

export const AuraBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-cyan-50/60 to-blue-50/80" />

            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full opacity-40"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.25) 0%, rgba(14,165,233,0.15) 40%, transparent 70%)',
                    animation: 'aura-pulse 6s ease-in-out infinite',
                }}
            />

            <div
                className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)',
                    animation: 'orb-drift-1 12s ease-in-out infinite',
                }}
            />
            <div
                className="absolute -bottom-48 -right-32 w-[600px] h-[600px] rounded-full opacity-15"
                style={{
                    background: 'radial-gradient(circle, rgba(14,165,233,0.45) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)',
                    animation: 'orb-drift-2 15s ease-in-out infinite',
                }}
            />

            <div
                className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full opacity-15"
                style={{
                    background: 'radial-gradient(circle, rgba(20,184,166,0.5) 0%, transparent 70%)',
                    animation: 'orb-drift-3 10s ease-in-out infinite',
                }}
            />
            {[...Array(18)].map((_, i) => (
                <div
                     key={i}
                     className="absolute rounded-full"
                     style={{
                         width: `${2 + (i % 4)}px`,
                         height: `${2 + (i % 4)}px`,
                         left: `${(i * 5.5 + 3) % 100}%`,
                         top: `${(i * 7.3 + 10) % 85}%`,
                         background: i % 3 === 0
                             ? 'rgba(6,182,212,0.6)'
                             : i % 3 === 1
                                 ? 'rgba(14,165,233,0.5)'
                                 : 'rgba(20,184,166,0.55)',
                         animation: `particle-float ${5 + (i % 5)}s ease-in-out infinite`,
                         animationDelay: `${(i * 0.7) % 6}s`,
                     }}
                 />
            ))}
            <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgb(6,182,212)" strokeWidth="0.8" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>
    );
};
