import React, { useState } from 'react';
import { Cookie, SameSite } from "@/types";
import { Button } from '../ui/button';
import { Plus, Cookie as CookieIcon, Upload } from 'lucide-react';
import { CookieForm } from './CookieManager/CookieForm';
import { CookieItem } from './CookieManager/CookieItem';
import { DeleteConfirmationModal } from '../Modal/DeleteConfirmationModal';

interface CookieManagerProps {
    cookies: Cookie[];
    onAdd: (cookie: Omit<Cookie, 'id'>) => Promise<void>;
    onUpdate: (id: number, cookie: Omit<Cookie, 'id'>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onImport?: (cookies: Omit<Cookie, 'id'>[]) => Promise<void>;
    isLoading?: boolean;
}

export const CookieManager: React.FC<CookieManagerProps> = ({
    cookies,
    onAdd,
    onUpdate,
    onDelete,
    onImport,
    isLoading = false
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [deleteCookieId, setDeleteCookieId] = useState<number | null>(null);

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (cookie: Cookie) => {
        setEditingId(cookie.id || null);
        setIsAdding(false);
    };

    const handleSubmit = async (formData: Omit<Cookie, 'id'>) => {
        try {
            setActionLoading(true);
            if (editingId !== null) {
                await onUpdate(editingId, formData);
            } else {
                await onAdd(formData);
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save cookie:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setActionLoading(true);
            await onDelete(id);
            setDeleteCookieId(null);
        } catch (error) {
            console.error('Failed to delete cookie:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !onImport) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                
                if (Array.isArray(parsed)) {
                    const sanitized = parsed.map((raw: any): Omit<Cookie, 'id'> => {
                        let sameSite: SameSite | undefined = undefined;
                        if (typeof raw.sameSite === 'string') {
                            const lower = raw.sameSite.toLowerCase();
                            if (lower === 'lax') {
                                sameSite = 'Lax';
                            } else if (lower === 'none' || lower === 'no_restriction') {
                                sameSite = 'None';
                            } else if (lower === 'strict') {
                                sameSite = 'Strict';
                            }
                        }

                        let expires: number | undefined = undefined;
                        if (typeof raw.expires === 'number') {
                            expires = raw.expires;
                        } else if (typeof raw.expirationDate === 'number') {
                            expires = raw.expirationDate;
                        }

                        const cookie: Omit<Cookie, 'id'> = {
                            name: String(raw.name || ''),
                            value: String(raw.value || ''),
                            domain: typeof raw.domain === 'string' ? raw.domain : undefined,
                            path: typeof raw.path === 'string' ? raw.path : undefined,
                            secure: typeof raw.secure === 'boolean' ? raw.secure : false,
                            httpOnly: typeof raw.httpOnly === 'boolean' ? raw.httpOnly : false,
                        };

                        if (sameSite) cookie.sameSite = sameSite;
                        if (expires !== undefined) cookie.expires = expires;
                        if (typeof raw.url === 'string') cookie.url = raw.url;
                        if (typeof raw.partitionKey === 'string') cookie.partitionKey = raw.partitionKey;

                        return cookie;
                    });

                    setActionLoading(true);
                    await onImport(sanitized);
                }
            } catch (error) {
                console.error('Failed to parse cookies JSON:', error);
            } finally {
                setActionLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const cookieToDelete = deleteCookieId !== null ? cookies.find(c => c.id === deleteCookieId) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CookieIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-gray-900 font-sans">Cookies</h3>
                </div>
                {!isAdding && editingId === null && (
                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        {onImport && (
                            <Button
                                onClick={handleImportClick}
                                variant="outline"
                                className="border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 gap-2 font-bold"
                                size="sm"
                                disabled={actionLoading || isLoading}
                            >
                                <Upload className="w-4 h-4" />
                                Import JSON
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 gap-2 font-bold"
                            size="sm"
                            disabled={actionLoading || isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Add Cookie
                        </Button>
                    </div>
                )}
            </div>

            {isAdding && (
                <CookieForm
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    isLoading={actionLoading || isLoading}
                />
            )}

            <div className="grid grid-cols-1 gap-3">
                {cookies.length === 0 && !isAdding ? (
                    <div className="text-center py-8 bg-gray-50/30 border border-dashed border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-400">No cookies configured for this entity.</p>
                    </div>
                ) : (
                    cookies.map((cookie) => {
                        if (editingId === cookie.id) {
                            return (
                                <CookieForm
                                    key={cookie.id}
                                    initialData={cookie}
                                    onSubmit={handleSubmit}
                                    onCancel={resetForm}
                                    isLoading={actionLoading || isLoading}
                                />
                            );
                        }
                        return (
                            <CookieItem
                                key={cookie.id}
                                cookie={cookie}
                                isEditing={false}
                                isActionsDisabled={actionLoading || isAdding || editingId !== null || isLoading}
                                onEdit={handleEdit}
                                onDelete={(id) => setDeleteCookieId(id)}
                            />
                        );
                    })
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={deleteCookieId !== null}
                onClose={() => setDeleteCookieId(null)}
                onConfirm={() => deleteCookieId !== null && handleDelete(deleteCookieId)}
                itemName={cookieToDelete?.name}
                isLoading={actionLoading}
            />
        </div>
    );
};
