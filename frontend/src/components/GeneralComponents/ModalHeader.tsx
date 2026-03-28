import { X, LucideIcon } from "lucide-react";

interface ModalHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    onClose: () => void;
    hideClose?: boolean;
    iconColorClass?: string;
    bgColorClass?: string;
}

export const ModalHeader = ({
    title,
    subtitle,
    icon: Icon,
    onClose,
    hideClose = false,
    iconColorClass = "text-primary",
    bgColorClass = "bg-primary/10"
}: ModalHeaderProps) => {
    return (
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className={`w-10 h-10 rounded-xl ${bgColorClass} flex items-center justify-center ${iconColorClass}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <div>
                    <h3 className="font-bold text-lg text-foreground">{title}</h3>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            {!hideClose && (
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};
