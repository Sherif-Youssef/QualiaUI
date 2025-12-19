import React from 'react';

export const GlassCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative w-full max-w-[850px] mx-4 min-h-[500px] h-auto bg-white/5 border-2 border-white/30 rounded-[20px] flex flex-col md:flex-row overflow-hidden backdrop-blur-[50px] shadow-2xl">
      {children}
    </div>
  );
};
