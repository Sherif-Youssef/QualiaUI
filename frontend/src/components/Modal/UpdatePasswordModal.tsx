import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { passwordService } from '@/services/password';
import { ModalHeader, ErrorMessage, SuccessMessage } from '@/components/GeneralComponents';

interface Props {
    onClose: () => void;
}

export const UpdatePasswordModal: React.FC<Props> = ({ onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const requirements = [
        { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
        { label: 'At least one uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'At least one number', test: (p: string) => /[0-9]/.test(p) },
        { label: 'At least one special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
    ];
    const metRequirements = requirements.filter(req => req.test(newPassword)).length;
    const allRequirementsMet = metRequirements === requirements.length;
    const isMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;
    const isReady = currentPassword && newPassword && confirmPassword && !isMismatch && allRequirementsMet;

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
                onClose();
            }, 1500);
        } catch (err: any) {
            const message = err.response?.data?.detail || err.message || 'Something went wrong';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <ModalHeader
                    title="Update Password"
                    subtitle="Secure your account with a new password"
                    icon={Lock}
                    onClose={onClose}
                />

                <form onSubmit={handleUpdate} className="p-8 space-y-5">
                    {/* Status Messages */}
                    {error && <ErrorMessage message={error} />}
                    {success && <SuccessMessage message={success} />}

                    {/* Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Current Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-border bg-muted/30 focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Create new password"
                                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-border bg-muted/30 focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div
                                className={`grid transition-all duration-500 ease-in-out ${newPassword ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
                                    }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="space-y-4 pt-1">
                                        <div className="flex justify-between items-end px-1">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Security Level</p>
                                                <p className={`text-xs font-bold transition-colors duration-300 ${metRequirements <= 1 ? 'text-failure' :
                                                    metRequirements <= 3 ? 'text-tertiary' : 'text-success'
                                                    }`}>
                                                    {metRequirements === 0 ? 'Very Weak' :
                                                        metRequirements <= 1 ? 'Weak Password' :
                                                            metRequirements <= 3 ? 'Medium Strength' : 'Secure Password'}
                                                </p>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground">{metRequirements}/4</p>
                                        </div>

                                        <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden flex gap-1.5 p-0.5 border border-border/50">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-full flex-1 transition-all duration-700 ease-out rounded-full ${i < metRequirements
                                                        ? (metRequirements <= 1 ? 'bg-failure shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                                            metRequirements <= 3 ? 'bg-tertiary shadow-[0_0_8px_rgba(245,158,11,0.4)]' :
                                                                'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]')
                                                        : 'bg-transparent'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat new password"
                                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border bg-muted/30 focus:bg-background focus:ring-4 outline-none transition-all font-medium ${isMismatch
                                        ? 'border-failure ring-failure/10'
                                        : 'border-border focus:ring-primary/10 focus:border-primary'
                                        }`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {isMismatch && (
                                <p className="text-[11px] text-failure font-bold ml-1 animate-in fade-in slide-in-from-top-1">Passwords do not match</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={!isReady || isLoading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 h-14"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Updating...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-4 text-muted-foreground font-bold hover:bg-muted/50 rounded-2xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};