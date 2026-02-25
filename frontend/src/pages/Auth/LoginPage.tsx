import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socialAuthService } from '@/services/auth/socialAuth';
import { authService } from '@/services/auth/auth';
import { twoFactorAuthService } from '@/services/auth/2Fauth';
import { ErrorMessage } from '@/components/GeneralComponents';

// Normalized Components
import {
  AuthHeader,
  AuthForm,
  MfaVerification,
  SocialAuth,
  AuthFooter,
  AuthLayout
} from './index';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  useEffect(() => {
    const checkIsLoggedIn = async () => {
      try {
        const isValid = await authService.checkStoredToken();
        if (isValid) navigate('/dashboard');
      } catch (err) { }
    };
    checkIsLoggedIn();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await authService.login(username, password);

      if (data.mfa_required) {
        setIsMfaRequired(true);
        setMfaToken(data.mfa_token);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) return;

    setLoading(true);
    setError(null);

    try {
      await twoFactorAuthService.verify2FA(mfaToken, totpCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    socialAuthService.login(provider);
  };

  return (
    <AuthLayout>
      <AuthHeader
        head={isMfaRequired ? "Security Verification" : "QUALIA"}
        explain={isMfaRequired ? "Enter the 6-digit code from your authenticator app" : "Sign in to your account"}
      />

      {error && <ErrorMessage message={error} />}

      {!isMfaRequired ? (
        <>
          <AuthForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            submitLabel="Sign In"
            fields={[
              {
                id: 'username',
                label: 'Username',
                type: 'text',
                placeholder: 'Enter your username',
                value: username,
                onChange: setUsername
              },
              {
                id: 'password',
                label: 'Password',
                type: 'password',
                placeholder: '••••••••',
                value: password,
                onChange: setPassword,
                rightElement: (
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )
              }
            ]}
          />

          <SocialAuth onSocialLogin={handleSocialLogin} />
        </>
      ) : (
        <MfaVerification
          totpCode={totpCode}
          setTotpCode={setTotpCode}
          onSubmit={handleMfaVerify}
          isLoading={isLoading}
          onBackToLogin={() => setIsMfaRequired(false)}
        />
      )}

      <AuthFooter
        mainText="Don't have an account?"
        actionText="Sign up for free"
        onAction={() => navigate('/register')}
      />
    </AuthLayout>
  );
};
