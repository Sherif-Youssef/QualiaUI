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
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            ))}
            <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/75 text-white py-2.5 rounded-lg font-medium shadow-sm transition-all"
                disabled={isLoading}
            >
                {isLoading ? "Processing..." : submitLabel}
            </Button>
        </form>
    );
};
