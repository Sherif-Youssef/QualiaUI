import React from 'react';
interface SectionProps{
    width?: string; 
    children?: React.ReactNode;
    className?: string;
    background?: string;
}
export const Section: React.FC<SectionProps> = ({ width = 'w-1/2', children, className = '', background = '' }) => {
  return (
    <div
      className={`${width} flex justify-center items-center p-4 md:p-10 ${className}`}
      style={{ background: background }}
    >
      {children}
    </div>
  );
};
