import React, { useState, useEffect } from 'react';
import { Cookie, SameSite } from "@/types";
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Check, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';

interface CookieFormProps {
    initialData?: Omit<Cookie, 'id'> | null;
    onSubmit: (data: Omit<Cookie, 'id'>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const CookieForm: React.FC<CookieFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false
}) => {
    const [formData, setFormData] = useState<Omit<Cookie, 'id'>>({
        name: '',
        value: '',
        domain: '',
        path: '',
        secure: false,
        httpOnly: false,
        sameSite: 'Lax'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                value: initialData.value || '',
                domain: initialData.domain || '',
                path: initialData.path || '',
                secure: initialData.secure || false,
                httpOnly: initialData.httpOnly || false,
                sameSite: initialData.sameSite || 'Lax'
            });
        } else {
            setFormData({
                name: '',
                value: '',
                domain: '',
                path: '',
                secure: false,
                httpOnly: false,
                sameSite: 'Lax'
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.value) return;
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50/50 border border-gray-100 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase">Cookie Name <span className="text-red-500">*</span></Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., session_id"
                        className="h-10 bg-white"
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase">Cookie Value <span className="text-red-500">*</span></Label>
                    <Input
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder="Value"
                        className="h-10 bg-white"
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase">Domain</Label>
                    <Input
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="example.com"
                        className="h-10 bg-white"
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase">Path</Label>
                    <Input
                        value={formData.path}
                        onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                        placeholder="/"
                        className="h-10 bg-white"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="secure"
                        checked={formData.secure}
                        onCheckedChange={(checked) => setFormData({ ...formData, secure: !!checked })}
                        disabled={isLoading}
                    />
                    <Label htmlFor="secure" className="text-sm font-medium leading-none cursor-pointer">Secure</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="httpOnly"
                        checked={formData.httpOnly}
                        onCheckedChange={(checked) => setFormData({ ...formData, httpOnly: !!checked })}
                        disabled={isLoading}
                    />
                    <Label htmlFor="httpOnly" className="text-sm font-medium leading-none cursor-pointer">HttpOnly</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">SameSite:</Label>
                    <Select
                        value={formData.sameSite}
                        onValueChange={(val) => setFormData({ ...formData, sameSite: val as SameSite })}
                        disabled={isLoading}
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
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="text-gray-500 font-bold"
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-primary text-white hover:bg-primary/90 font-bold gap-2"
                    disabled={isLoading || !formData.name || !formData.value}
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        initialData ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />
                    )}
                    {initialData ? 'Update Cookie' : 'Add Cookie'}
                </Button>
            </div>
        </form>
    );
};
