import React from 'react';

export const TopMenuBar: React.FC = () => {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-headline-lg font-sans font-semibold text-foreground">
          QUALIA
        </h1>
        <span className="text-body-md text-muted-foreground font-body">
          AI Web Testing Agent
        </span>
      </div>
      
    </header>
  );
};
