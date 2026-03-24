import { ShieldCheck, LucideIcon } from "lucide-react";

export const SuccessMessage = ({ message, icon: Icon = ShieldCheck }: { message: string, icon?: LucideIcon }) => {
    return (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3 text-success text-sm animate-in slide-in-from-top-2">
            <Icon className="w-4 h-4 shrink-0" />
            {message}
        </div>
    );
};
