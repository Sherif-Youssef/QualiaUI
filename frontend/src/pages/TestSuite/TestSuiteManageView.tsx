import React, { useState, useEffect } from 'react';
import { TestSuite } from '@/types/test-suit';
import { testSuiteService } from '@/services/testSuit/testSuiteService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ErrorMessage } from '@/components/GeneralComponents';
import { Save, Trash2, CheckCircle2 } from 'lucide-react';
import { DeleteConfirmationModal } from '@/components/Modal/DeleteConfirmationModal';
import { useNavigate } from 'react-router-dom';

import { CookieManager } from '@/components/GeneralComponents/CookieManager';
import { Cookie } from '@/types/cookie';

interface TestSuiteManageViewProps {
    projectId: string;
    suiteId: string;
}

export const TestSuiteManageView: React.FC<TestSuiteManageViewProps> = ({
    projectId,
    suiteId
}) => {
    const navigate = useNavigate();
    const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const [cookies, setCookies] = useState<Cookie[]>([]);

    const fetchTestSuite = async () => {
        try {
            setLoading(true);
            const data = await testSuiteService.getTestSuiteById(projectId, suiteId);
            setTestSuite(data);
            setFormData({
                name: data.name,
                description: data.description || ''
            });
            setCookies(data.cookies || []);
        } catch (err) {
            setError('Failed to load test suite details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestSuite();
    }, [projectId, suiteId]);

    const handleAddCookie = async (cookie: Omit<Cookie, 'id'>) => {
        await testSuiteService.addCookie(projectId, suiteId, cookie);
        const data = await testSuiteService.getTestSuiteById(projectId, suiteId);
        setCookies(data.cookies || []);
    };

    const handleUpdateCookie = async (id: number, cookie: Omit<Cookie, 'id'>) => {
        await testSuiteService.updateCookie(projectId, suiteId, id, cookie);
        const data = await testSuiteService.getTestSuiteById(projectId, suiteId);
        setCookies(data.cookies || []);
    };

    const handleDeleteCookie = async (id: number) => {
        await testSuiteService.deleteCookie(projectId, suiteId, id);
        const data = await testSuiteService.getTestSuiteById(projectId, suiteId);
        setCookies(data.cookies || []);
    };

    const handleImportCookies = async (importedCookies: Omit<Cookie, 'id'>[]) => {
        try {
            setError(null);
            for (const cookie of importedCookies) {
                await testSuiteService.addCookie(projectId, suiteId, cookie);
            }
            const data = await testSuiteService.getTestSuiteById(projectId, suiteId);
            setCookies(data.cookies || []);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to import cookies');
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);
            await testSuiteService.updateTestSuite(projectId, suiteId, formData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to update test suite');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await testSuiteService.deleteTestSuite(projectId, suiteId);
            navigate(`/project/${projectId}`);
        } catch (err) {
            setError('Failed to delete test suite');
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center ">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium font-sans">Loading test suite details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto  p-8 [scrollbar-width:thin] [scrollbar-color:#E5E7EB_transparent]">
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-sans">Manage Test Suite</h1>
                        <p className="text-sm text-gray-500 mt-1">View and update test suite configuration</p>
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

                <div className="space-y-6">
                    <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">
                            Test Suite Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                            placeholder="Enter test suite name"
                            disabled={saving || deleting}
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">
                            Description
                        </Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[148px] border-gray-200 focus:border-primary focus:ring-primary/20 resize-none"
                            placeholder="Provide a brief overview of this test suite"
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
            </div>

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                itemName={testSuite?.name || "this test suite"}
                isLoading={deleting}
                error={error}
            />
        </div>
    );
};
