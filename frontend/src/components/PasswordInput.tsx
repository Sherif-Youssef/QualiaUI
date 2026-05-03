import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    required?: boolean;
    hasError?: boolean;
    errorMessage?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
    label,
    value,
    onChange,
    placeholder,
    required = true,
    hasError = false,
    errorMessage
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{label}</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border bg-muted/30 focus:bg-background focus:ring-4 outline-none transition-all font-medium ${
                        hasError
                            ? 'border-failure ring-failure/10'
                            : 'border-border focus:ring-primary/10 focus:border-primary'
                    }`}
                    required={required}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            {hasError && errorMessage && (
                <p className="text-[11px] text-failure font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errorMessage}</p>
            )}
        </div>
    );
};
