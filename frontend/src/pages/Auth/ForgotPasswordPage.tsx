import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { passwordService } from '@/services/password';
import { ErrorMessage, SuccessMessage } from '@/components/GeneralComponents';
import { AuthHeader, AuthForm, AuthFooter, AuthLayout } from './index';

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
        <AuthLayout>
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                </div>
                <AuthHeader
                    head="Forgot Password?"
                    explain="No worries, we'll send you reset instructions."
                />
            </div>

            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}

            <AuthForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                submitLabel="Reset Password"
                fields={[
                    {
                        id: 'email',
                        label: 'Email Address',
                        type: 'email',
                        placeholder: 'Enter your email',
                        value: email,
                        onChange: setEmail
                    }
                ]}
            />

            <AuthFooter
                mainText="Suddenly remembered?"
                actionText="Go back to login"
                onAction={() => navigate('/login')}
            />
        </AuthLayout>
    );
};
