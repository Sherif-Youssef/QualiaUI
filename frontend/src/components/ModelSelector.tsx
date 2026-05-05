import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    value,
    onChange,
    disabled,
    className
}) => {
    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn("w-[200px] bg-white border-gray-200 rounded-xl h-11 font-bold text-gray-700 shadow-sm hover:border-primary/30 transition-all", className)}>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <SelectValue placeholder="Select Model" />
                </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                <div className="px-2 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Available Models
                </div>
                <SelectItem value="gemini-1.5-pro" className="rounded-lg focus:bg-primary/5 focus:text-primary cursor-pointer py-2.5">
                    Gemini 1.5 Pro
                </SelectItem>
                <SelectItem value="gemini-1.5-flash" className="rounded-lg focus:bg-primary/5 focus:text-primary cursor-pointer py-2.5">
                    Gemini 1.5 Flash
                </SelectItem>
                <SelectItem value="gpt-4o" className="rounded-lg focus:bg-primary/5 focus:text-primary cursor-pointer py-2.5">
                    GPT-4o
                </SelectItem>
                <SelectItem value="claude-3-5-sonnet" className="rounded-lg focus:bg-primary/5 focus:text-primary cursor-pointer py-2.5">
                    Claude 3.5 Sonnet
                </SelectItem>
            </SelectContent>
        </Select>
    );
};
