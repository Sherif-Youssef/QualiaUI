import React from 'react';

interface PasswordStrengthMeterProps {
    passwordLength: number;
    metRequirementsCount: number;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
    passwordLength, 
    metRequirementsCount 
}) => {
    return (
        <div
            className={`grid transition-all duration-500 ease-in-out ${passwordLength > 0 ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
                }`}
        >
            <div className="overflow-hidden">
                <div className="space-y-4 pt-1">
                    <div className="flex justify-between items-end px-1">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Security Level</p>
                            <p className={`text-xs font-bold transition-colors duration-300 ${metRequirementsCount <= 2 ? 'text-failure' :
                                metRequirementsCount <= 4 ? 'text-tertiary' : 'text-success'
                                }`}>
                                {metRequirementsCount === 0 ? 'Very Weak' :
                                    metRequirementsCount <= 2 ? 'Weak Password' :
                                        metRequirementsCount <= 4 ? 'Medium Strength' : 'Secure Password'}
                            </p>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground">{metRequirementsCount}/5</p>
                    </div>

                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden flex gap-1.5 p-0.5 border border-border/50">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-full flex-1 transition-all duration-700 ease-out rounded-full ${i < metRequirementsCount
                                    ? (metRequirementsCount <= 2 ? 'bg-failure shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                        metRequirementsCount <= 4 ? 'bg-tertiary shadow-[0_0_8px_rgba(245,158,11,0.4)]' :
                                            'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]')
                                    : 'bg-transparent'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
