import React, { useState } from 'react';
import { passwordService } from '@/services/password/password';

export const usePasswordUpdate = (onSuccess: () => void) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const requirements = [
        { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
        { label: 'At least one uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'At least one lowercase letter', test: (p: string) => /[a-z]/.test(p) },
        { label: 'At least one number', test: (p: string) => /[0-9]/.test(p) },
        { label: 'At least one special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];
    
    const metRequirementsCount = requirements.filter(req => req.test(newPassword)).length;
    const allRequirementsMet = metRequirementsCount === requirements.length;
    const isMismatch = Boolean(newPassword && confirmPassword && newPassword !== confirmPassword);
    const isReady = Boolean(currentPassword && newPassword && confirmPassword && !isMismatch && allRequirementsMet);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isReady) return;

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await passwordService.updatePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });
            setSuccess('Password updated successfully');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            let message = 'Something went wrong';

            if (typeof detail === 'string') {
                message = detail;
            } else if (Array.isArray(detail)) {
                message = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
            } else if (err.message) {
                message = err.message;
            }

            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        isLoading,
        error,
        success,
        metRequirementsCount,
        isMismatch,
        isReady,
        handleUpdate
    };
};
