import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { passwordService } from '@/services/password';
import { ArrowLeft, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const message = await passwordService.forgotPassword(email);
            setSuccess(message);
        } catch (error: any) {
            const apiErrorMessage = error.response?.data?.detail || "Failed to process request. Please try again.";
            setError(apiErrorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-sans font-bold text-gray-800 mb-2">Forgot Password?</h1>
                        <p className="text-sm text-gray-500">No worries, we'll send you reset instructions.</p>
                    </div>

                    {error && (
                        <div className="bg-failure/10 border border-failure/20 text-failure px-4 py-2 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-success/10 border border-success/20 text-success px-4 py-2 rounded-lg text-sm mb-4">
                            {success}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-medium shadow-sm transition-all"
                        >
                            {isLoading ? 'Processing...' : 'Reset Password'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
