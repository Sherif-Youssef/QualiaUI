import React, { useState, useEffect } from 'react';
import { TestCase } from '@/types';
import { testCaseService } from '@/services/testCase/testCaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ErrorMessage } from '@/components/GeneralComponents';
import { Save, Trash2, CheckCircle2 } from 'lucide-react';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { useNavigate } from 'react-router-dom';

import { CookieManager } from '@/components/GeneralComponents/CookieManager';
import { Cookie } from '@/types';

interface TestCaseManageViewProps {
    projectId: string;
    suiteId: string;
    caseId: string;
}

export const TestCaseManageView: React.FC<TestCaseManageViewProps> = ({
    projectId,
    suiteId,
    caseId
}) => {
    const navigate = useNavigate();
    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        preconditions: '',
        objectives: '',
        url: '',
        plainText: ''
    });

    const [cookies, setCookies] = useState<Cookie[]>([]);

    const fetchTestCase = async () => {
        try {
            setLoading(true);
            const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
            setTestCase(data);
            setFormData({
                name: data.name,
                description: data.description || '',
                preconditions: data.preconditions || '',
                objectives: data.objectives || '',
                url: data.url,
                plainText: data.plainText || ''
            });
            setCookies(data.cookies || []);
        } catch (err) {
            setError('Failed to load test case details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestCase();
    }, [projectId, suiteId, caseId]);

    const handleAddCookie = async (cookie: Omit<Cookie, 'id'>) => {
        await testCaseService.addCookie(projectId, suiteId, caseId, cookie);
        const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
        setCookies(data.cookies || []);
    };

    const handleUpdateCookie = async (id: number, cookie: Omit<Cookie, 'id'>) => {
        await testCaseService.updateCookie(projectId, suiteId, caseId, id, cookie);
        const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
        setCookies(data.cookies || []);
    };

    const handleDeleteCookie = async (id: number) => {
        await testCaseService.deleteCookie(projectId, suiteId, caseId, id);
        const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
        setCookies(data.cookies || []);
    };

    const handleImportCookies = async (importedCookies: Omit<Cookie, 'id'>[]) => {
        try {
            setError(null);
            for (const cookie of importedCookies) {
                await testCaseService.addCookie(projectId, suiteId, caseId, cookie);
            }
            const data = await testCaseService.getTestCaseById(projectId, suiteId, caseId);
            setCookies(data.cookies || []);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to import cookies');
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.url.trim() || !formData.plainText.trim()) {
            setError('Name, URL and Instructions are required');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);
            await testCaseService.updateTestCase(projectId, suiteId, caseId, formData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to update test case');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await testCaseService.deleteTestCase(projectId, suiteId, caseId);
            navigate(`/project/${projectId}/suite/${suiteId}`);
        } catch (err) {
            setError('Failed to delete test case');
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium font-sans">Loading test case details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-white p-8 [scrollbar-width:thin] [scrollbar-color:#E5E7EB_transparent]">
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-sans">Manage Test Case</h1>
                        <p className="text-sm text-gray-500 mt-1">View and update test case configuration</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {success && (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm animate-in fade-in slide-in-from-right-4">
                                <CheckCircle2 className="w-4 h-4" />
                                Changes saved
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="text-failure border-gray-200 hover:bg-failure/5 hover:text-failure hover:border-failure/30 gap-2 h-11 px-6 font-bold"
                                onClick={() => setShowDeleteModal(true)}
                                disabled={saving || deleting}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving || deleting}
                                className="bg-primary hover:bg-primary/90 text-white gap-2 h-11 px-8 shadow-md shadow-primary/20 transition-all font-bold"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </div>
                                ) : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>

                {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <Label className="text-sm font-bold text-gray-700 mb-2 block">
                                Test Case Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                                placeholder="Enter test case name"
                                disabled={saving || deleting}
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-gray-700 mb-2 block">
                                Website URL <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                                placeholder="https://example.com"
                                disabled={saving || deleting}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">
                            Description
                        </Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[148px] border-gray-200 focus:border-primary focus:ring-primary/20 resize-none"
                            placeholder="Provide a brief overview of this test case"
                            disabled={saving || deleting}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">
                            Preconditions
                        </Label>
                        <Textarea
                            value={formData.preconditions}
                            onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                            placeholder="State what needs to be true before starting (e.g., User must be logged in)"
                            className="min-h-[120px] border-gray-200 focus:border-primary focus:ring-primary/20"
                            disabled={saving || deleting}
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">
                            Objectives
                        </Label>
                        <Textarea
                            value={formData.objectives}
                            onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                            placeholder="Describe the desired outcome or what is being tested"
                            className="min-h-[120px] border-gray-200 focus:border-primary focus:ring-primary/20"
                            disabled={saving || deleting}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-sm font-bold text-gray-700 block">
                        Prompt Instructions <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        value={formData.plainText}
                        onChange={(e) => setFormData({ ...formData, plainText: e.target.value })}
                        placeholder="Describe your test scenario... (e.g., Navigate to login, fill email and pass, then click sign in)"
                        className="min-h-[250px] border-gray-200 focus:border-primary focus:ring-primary/20 font-mono text-sm leading-relaxed"
                        disabled={saving || deleting}
                    />
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <CookieManager
                        cookies={cookies}
                        onAdd={handleAddCookie}
                        onUpdate={handleUpdateCookie}
                        onDelete={handleDeleteCookie}
                        onImport={handleImportCookies}
                    />
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                itemName={testCase?.name || "this test case"}
                isLoading={deleting}
                error={error}
            />
        </div>
    );
};
