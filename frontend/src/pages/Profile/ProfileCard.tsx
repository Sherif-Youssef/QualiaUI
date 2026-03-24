import React from "react";

interface ProfileCardProps {
    title: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ title, description, icon, children, className }) => {
    return (
        <div className={`bg-card rounded-2xl p-5 md:p-8 border border-border shadow-sm ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="space-y-1 text-left">
                    <h2 className="text-xl md:text-headline-sm font-bold flex items-center gap-3">
                        <span className="text-primary">{icon}</span>
                        {title}
                    </h2>
                    {description && (
                        <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
};
