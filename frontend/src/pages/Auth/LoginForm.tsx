import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
    username: string;
    password: string;
    setUsername: (val: string) => void;
    setPassword: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
    username,
    password,
    setUsername,
    setPassword,
    onSubmit,
    isLoading,
    onForgotPassword
}) => {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                </Label>
                <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:ring-primary/20 focus:border-primary rounded-xl"
                />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                    </Label>
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-xs text-primary hover:underline font-medium"
                    >
                        Forgot password?
                    </button>
                </div>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:ring-primary/20 focus:border-primary rounded-xl"
                />
            </div>
            <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={isLoading}
            >
                {isLoading ? "Signing in..." : "Sign In"}
            </Button>
        </form>
    );
};
