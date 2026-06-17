import React, { useState } from 'react';
import { Cookie, SameSite } from "@/types";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Trash2, Edit2, Plus, X, Check, Cookie as CookieIcon, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

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

    const [formData, setFormData] = useState<Omit<Cookie, 'id'>>({
        name: '',
        value: '',
        domain: '',
        path: '',
        secure: false,
        httpOnly: false,
        sameSite: 'Lax'
    });

    const resetForm = () => {
        setFormData({
            name: '',
            value: '',
            domain: '',
            path: '',
            secure: false,
            httpOnly: false,
            sameSite: 'Lax'
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (cookie: Cookie) => {
        setFormData({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain || '',
            path: cookie.path || '',
            secure: cookie.secure || false,
            httpOnly: cookie.httpOnly || false,
            sameSite: cookie.sameSite || 'Lax'
        });
        setEditingId(cookie.id || null);
        setIsAdding(false);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.value) return;

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
                const importedCookies = JSON.parse(content);
                
                if (Array.isArray(importedCookies)) {
                    setActionLoading(true);
                    await onImport(importedCookies);
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
                                className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 font-bold"
                                size="sm"
                                disabled={actionLoading}
                            >
                                <Upload className="w-4 h-4" />
                                Import JSON
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 gap-2 font-bold"
                            size="sm"
                            disabled={actionLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Add Cookie
                        </Button>
                    </div>
                )}
            </div>

            {(isAdding || editingId !== null) && (
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Cookie Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., session_id"
                                className="h-10 bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Cookie Value *</Label>
                            <Input
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                placeholder="Value"
                                className="h-10 bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Domain</Label>
                            <Input
                                value={formData.domain}
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                placeholder="example.com"
                                className="h-10 bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Path</Label>
                            <Input
                                value={formData.path}
                                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                placeholder="/"
                                className="h-10 bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="secure"
                                checked={formData.secure}
                                onCheckedChange={(checked) => setFormData({ ...formData, secure: !!checked })}
                            />
                            <Label htmlFor="secure" className="text-sm font-medium leading-none cursor-pointer">Secure</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="httpOnly"
                                checked={formData.httpOnly}
                                onCheckedChange={(checked) => setFormData({ ...formData, httpOnly: !!checked })}
                            />
                            <Label htmlFor="httpOnly" className="text-sm font-medium leading-none cursor-pointer">HttpOnly</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">SameSite:</Label>
                            <Select
                                value={formData.sameSite}
                                onValueChange={(val) => setFormData({ ...formData, sameSite: val as SameSite })}
                            >
                                <SelectTrigger className="w-[120px] h-9 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Lax">Lax</SelectItem>
                                    <SelectItem value="None">None</SelectItem>
                                    <SelectItem value="Strict">Strict</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={resetForm}
                            className="text-gray-500 font-bold"
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-primary text-white hover:bg-primary/90 font-bold gap-2"
                            disabled={actionLoading || !formData.name || !formData.value}
                        >
                            {actionLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                editingId !== null ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />
                            )}
                            {editingId !== null ? 'Update Cookie' : 'Add Cookie'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {cookies.length === 0 && !isAdding && editingId === null ? (
                    <div className="text-center py-8 bg-gray-50/30 border border-dashed border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-400">No cookies configured for this entity.</p>
                    </div>
                ) : (
                    cookies.map((cookie) => (
                        <div
                            key={cookie.id}
                            className={`group flex items-center justify-between p-4 bg-white border rounded-xl transition-all hover:border-primary/30 hover:shadow-sm ${
                                editingId === cookie.id ? 'border-primary ring-1 ring-primary/20' : 'border-gray-100'
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
                                    onClick={() => handleEdit(cookie)}
                                    disabled={actionLoading || isAdding || editingId !== null}
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-gray-400 hover:text-failure hover:bg-failure/5"
                                    onClick={() => cookie.id && handleDelete(cookie.id)}
                                    disabled={actionLoading || isAdding || editingId !== null}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
