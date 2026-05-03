import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import { ModalHeader, ErrorMessage, SuccessMessage } from '@/components/GeneralComponents';
import { usePasswordUpdate } from '@/hooks/usePasswordUpdate';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';

interface Props {
    onClose: () => void;
    isForced?: boolean;
}

export const UpdatePasswordModal: React.FC<Props> = ({ onClose, isForced = false }) => {
    const {
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
    } = usePasswordUpdate(onClose);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <ModalHeader
                    title={isForced ? "Security Reset Required" : "Update Password"}
                    subtitle={isForced ? "You must set a new password before proceeding" : "Secure your account with a new password"}
                    icon={Lock}
                    onClose={onClose}
                    hideClose={isForced}
                />

                <form onSubmit={handleUpdate} className="p-8 space-y-5">
                    {error && <ErrorMessage message={error} />}
                    {success && <SuccessMessage message={success} />}

                    <div className="space-y-4">
                        <PasswordInput 
                            label="Current Password"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            placeholder="Enter current password"
                        />

                        <div>
                            <PasswordInput 
                                label="New Password"
                                value={newPassword}
                                onChange={setNewPassword}
                                placeholder="Create new password"
                            />
                            <PasswordStrengthMeter 
                                passwordLength={newPassword.length}
                                metRequirementsCount={metRequirementsCount}
                            />
                        </div>

                        <PasswordInput 
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Repeat new password"
                            hasError={isMismatch}
                            errorMessage="Passwords do not match"
                        />
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
                        {
                            !isForced && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-4 text-muted-foreground font-bold hover:bg-muted/50 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>
                            )
                        }
                    </div>
                </form>
            </div>
        </div>
    );
};