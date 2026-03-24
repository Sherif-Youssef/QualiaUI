import { ShieldCheck, ShieldOff } from "lucide-react";

export const FinalizingScreen = ({ mode }: { mode: 'enable' | 'disable' }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300 shadow-2xl">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${mode === 'enable' ? 'bg-success/10 text-success' : 'bg-failure/10 text-failure'
                    }`}>
                    {mode === 'enable' ? <ShieldCheck className="w-10 h-10" /> : <ShieldOff className="w-10 h-10" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {mode === 'enable' ? '2FA Enabled!' : '2FA Disabled'}
                </h2>
                <p className="text-muted-foreground">Your account security has been updated.</p>
            </div>
        </div>
    );
}