import React from 'react';
import { ErrorMessage } from '@/components/GeneralComponents';
import { useLogin } from './hooks/useLogin';

import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';
import { AuthLayout } from './AuthLayout';

export const LoginPage: React.FC = () => {
  const {
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    error,
    setError,
    handleLogin,
  } = useLogin();

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
            onChange: setPassword
          }
        ]}
      />
    </AuthLayout>
  );
};

