import React from 'react';
import { LucideIcon } from "lucide-react";
import { BaseInput } from "./Baseinput";
import { Label } from "./label";

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement>{
    label: string;
    icon?: LucideIcon;
}

export const IconInput:React.FC<IconInputProps> = ({label, icon:Icon, className='', ...props}) => {
    return (
        <div className={`relative w-full mx-auto my-[30px] border-b-2 border-gray-500 ${className}`}>
            {Icon && (
                <span className="absolute right-2 top-[15px] text-gray-600 text-[1.2em] z-10">
                <Icon size={20} />
                </span>
            )}
            
            <BaseInput {...props} placeholder=" " className="w-full h-[50px] bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none px-1 pr-[35px] text-gray-900 text-[1em] placeholder-transparent peer" />
            <Label className="absolute left-[5px] top-1/2 text-gray-500 -translate-y-1/2 text-[1em] pointer-events-none transition-all duration-300 peer-focus:-top-[5px] peer-focus:text-sm peer-focus:text-gray-800 peer-[:not(:placeholder-shown)]:-top-[5px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:text-gray-800">
                {label}
            </Label>
        </div>
    );
};