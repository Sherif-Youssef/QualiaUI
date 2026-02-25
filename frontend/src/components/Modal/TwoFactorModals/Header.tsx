import { ShieldCheck, ShieldOff, X } from "lucide-react";

interface HeaderProps {
    mode: 'enable' | 'disable';
    onClose: () => void;
}
export const Header = ({ mode, onClose }: HeaderProps) => {
    return (
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold flex items-center gap-2">
                {mode === 'enable' ? <ShieldCheck className="w-6 h-6 text-primary" /> : <ShieldOff className="w-6 h-6 text-failure" />}
                {mode === 'enable' ? 'Enable 2FA' : 'Disable 2FA'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}