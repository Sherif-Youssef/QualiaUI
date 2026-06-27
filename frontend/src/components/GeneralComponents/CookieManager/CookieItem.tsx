import React from 'react';
import { Cookie } from "@/types";
import { Button } from '../../ui/button';
import { Trash2, Edit2, Cookie as CookieIcon } from 'lucide-react';

interface CookieItemProps {
    cookie: Cookie;
    isEditing: boolean;
    isActionsDisabled: boolean;
    onEdit: (cookie: Cookie) => void;
    onDelete: (id: number) => void;
}

export const CookieItem: React.FC<CookieItemProps> = ({
    cookie,
    isEditing,
    isActionsDisabled,
    onEdit,
    onDelete
}) => {
    return (
        <div
            className={`group flex items-center justify-between p-4 bg-white border rounded-xl transition-all hover:border-primary/30 hover:shadow-sm ${
                isEditing ? 'border-primary ring-1 ring-primary/20' : 'border-gray-100'
            }`}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <CookieIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 truncate">{cookie.name}</span>
                        <span className="text-xs font-medium text-gray-400 truncate max-w-[150px]">{cookie.value}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                        {cookie.domain && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Domain: {cookie.domain}
                            </span>
                        )}
                        {cookie.secure && (
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider bg-green-50 px-1.5 py-0.5 rounded">
                                Secure
                            </span>
                        )}
                        {cookie.httpOnly && (
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">
                                HttpOnly
                            </span>
                        )}
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-1.5 py-0.5 rounded">
                            {cookie.sameSite || 'Lax'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-gray-400 hover:text-primary hover:bg-primary/5"
                    onClick={() => onEdit(cookie)}
                    disabled={isActionsDisabled}
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-gray-400 hover:text-failure hover:bg-failure/5"
                    onClick={() => cookie.id && onDelete(cookie.id)}
                    disabled={isActionsDisabled}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
};
