import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth/auth';
import { ErrorMessage } from '@/components/GeneralComponents';

import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';
import { AuthLayout } from './AuthLayout';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/projects');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await authService.login(username, password);
      localStorage.setItem('token', data.access_token);
      if (data.must_change_password) {
        localStorage.setItem('must_change_password', 'true');
      }
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader
        head="QUALIA"
        explain="Sign in to your account"
      />

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

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
            placeholder: 'Enter your password',
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
    </AuthLayout>
  );
};

