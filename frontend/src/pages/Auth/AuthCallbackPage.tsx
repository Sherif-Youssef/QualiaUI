import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socialAuthService } from '@/services/auth/socialAuth';
import { AuthLayout } from './index';

export const AuthCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const code = searchParams.get('code');
        const provider = searchParams.get('state');
        if (code) {
            socialAuthService.verifySocialLogin(provider as "google" | "github", code)
                .then((data) => {
                    localStorage.setItem('token', data.token);
                })
                .then(() => navigate('/dashboard'))
                .catch(() => navigate('/login?error=social_failed'));
        }
    }, []);

    return (
        <AuthLayout>
            <div className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Authenticating...</h2>
                    <p className="text-muted-foreground animate-pulse">Connecting to the server, please wait.</p>
                </div>
            </div>
        </AuthLayout>
    );
};