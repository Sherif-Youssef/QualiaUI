import { useState, useEffect } from "react";
import { twoFactorAuthService } from "@/services/auth/2Fauth";
import { QRCodeSVG } from 'qrcode.react';
import { X, ShieldCheck, Copy, Check, Loader2, ArrowRight, ArrowLeft, ShieldOff } from 'lucide-react';
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { FinalizingScreen } from "./FinalizingScreen"
import { Header } from "./Header";
import { ErrorMessage } from "@/components/GeneralComponents";

interface TwoFactorModalProps {
    mode: 'enable' | 'disable';
    onClose: () => void;
    onSuccess: (process: 'enabling' | 'disabling') => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ mode, onClose, onSuccess }) => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [step, setStep] = useState(mode === 'enable' ? 1 : 2);
    const [setupData, setSetupData] = useState<{ secret: string, qr_code_uri: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [isFinalized, setIsFinalized] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    useEffect(() => {
        const getSetupData = async () => {
            if (mode === 'enable') {
                try {
                    const data = await twoFactorAuthService.get2FASetup();
                    setSetupData(data);
                }
                catch (err: any) {
                    setError(err.response?.data?.detail || "Failed to initialize 2FA setup.");
                }
            }
        }
        getSetupData();
    }, [mode]);

    const handleAction = async () => {
        if (totpCode.length !== 6) return;
        try {
            setLoading(true);
            setError(null);
            if (mode === 'enable') {
                if (!setupData) return;
                const response = await twoFactorAuthService.enable2FA(totpCode, setupData.secret);
                if (response) {
                    onSuccess('enabling');
                }
            }
            else {
                const response = await twoFactorAuthService.disable2FA(totpCode);
                if (response) {
                    onSuccess('disabling');
                }
            }
            setIsFinalized(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        }
        catch (err: any) {
            setError(err.response?.data?.detail || `Failed to ${mode} 2FA. Please check your code.`);
        }
        finally {
            setLoading(false);
        }
    }

    const copyToClipboard = () => {
        if (setupData?.secret) {
            navigator.clipboard.writeText(setupData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isFinalized) {
        return (
            <FinalizingScreen mode={mode} />
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <Header mode={mode} onClose={onClose} />

                <div className="p-8">
                    {error && (
                        <ErrorMessage message={error} />
                    )}

                    {step === 1 ? (
                        <div className="space-y-6 text-center animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-white p-4 rounded-2xl border-2 border-primary/10 inline-block shadow-inner">
                                {setupData ? (
                                    <QRCodeSVG value={setupData.qr_code_uri} size={180} />
                                ) : (
                                    <div className="w-[180px] h-[180px] flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-foreground">Step 1: Scan QR Code</p>
                                    <p className="text-xs text-muted-foreground">Open your authenticator app and scan the code above.</p>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border group">
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Manual Key</p>
                                        <code className="text-xs font-mono font-bold text-primary">{setupData?.secret || '•••• •••• •••• ••••'}</code>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-2 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={() => setStep(2)}
                                disabled={!setupData}
                                className="w-full bg-primary h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                I've scanned it <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="text-center space-y-2">
                                <p className="text-sm font-bold text-foreground">
                                    {mode === 'enable' ? 'Step 2: Verify Setup' : 'Verify Identity'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Enter the 6-digit code from your app to {mode === 'enable' ? 'finalize' : 'disable 2FA'}.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    type="text"
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="text-center text-3xl tracking-[0.2em] font-bold h-16 border-2 focus:border-primary"
                                    required
                                    autoFocus
                                />

                                <div className="flex gap-3 pt-2">
                                    {mode === 'enable' && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep(1)}
                                            className="flex-1 h-12 rounded-xl border-border font-bold flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" /> Back
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleAction}
                                        disabled={loading || totpCode.length !== 6}
                                        className={`flex-1 h-12 rounded-xl font-bold ${mode === 'disable' ? 'bg-failure hover:bg-failure/90' : 'bg-primary'}`}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'enable' ? "Verify & Enable" : "Verify & Disable")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        Secure by QualiaUI Authentication
                    </p>
                </div>
            </div>
        </div>
    );
};