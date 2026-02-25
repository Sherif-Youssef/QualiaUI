import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/auth';

export const AuthCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const code = searchParams.get('code');
        const provider = searchParams.get('state');
        if (code) {
            authService.verifySocialLogin(provider as "google" | "github", code)
                .then((data) => {
                    localStorage.setItem('token', data.token);
                })
                .then(() => navigate('/dashboard'))
                .catch(() => navigate('/login?error=social_failed'));
        }
    }, []);

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-medium animate-pulse">Authenticating with the server...</p>
        </div>
    );
};