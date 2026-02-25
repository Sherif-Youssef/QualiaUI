import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MfaVerificationProps {
    totpCode: string;
    setTotpCode: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    onBackToLogin: () => void;
}

export const MfaVerification: React.FC<MfaVerificationProps> = ({
    totpCode,
    setTotpCode,
    onSubmit,
    isLoading,
    onBackToLogin
}) => {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>
                <div className="space-y-2">
                    <Input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        className="h-16 text-center text-3xl tracking-[0.4em] font-bold border-gray-300 focus:ring-primary/20 focus:border-primary rounded-xl"
                        autoFocus
                    />
                </div>
            </div>
            <div className="space-y-3">
                <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
                    disabled={isLoading || totpCode.length !== 6}
                >
                    {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-12 text-gray-500 hover:text-gray-700"
                    onClick={onBackToLogin}
                >
                    Back to login
                </Button>
            </div>
        </form>
    );
};
