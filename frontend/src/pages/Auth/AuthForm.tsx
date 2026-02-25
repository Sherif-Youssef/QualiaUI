import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AuthField {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    required?: boolean;
    rightElement?: React.ReactNode;
}

interface AuthFormProps {
    fields: AuthField[];
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    isLoading: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({
    fields,
    onSubmit,
    submitLabel,
    isLoading
}) => {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
                            {field.label}
                        </Label>
                        {field.rightElement}
                    </div>
                    <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        required={field.required !== false}
                        className="h-12 border-gray-300 focus:ring-primary/20 focus:border-primary rounded-xl transition-all shadow-sm"
                    />
                </div>
            ))}
            <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2"
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                    </div>
                ) : submitLabel}
            </Button>
        </form>
    );
};
