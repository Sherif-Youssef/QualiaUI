import React from 'react';
import {
    Calendar,
    Clock,
    Cpu,
    User,
    Globe,
    FileText,
    Camera,
    Video,
    Hash,
    Layers,
    Settings
} from 'lucide-react';
import { formatDate, parseUTCDate } from '@/utils/formatters';

interface TestCaseRunDetailsViewProps {
    runDetails: any;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary shrink-0">
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</span>
            <span className="text-sm font-bold text-gray-900">{value || '--'}</span>
        </div>
    </div>
);

export const TestCaseRunDetailsView: React.FC<TestCaseRunDetailsViewProps> = ({
    runDetails
}) => {
    if (!runDetails) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const duration = () => {
        if (!runDetails.started_at || !runDetails.finished_at) return null;
        const start = parseUTCDate(runDetails.started_at)?.getTime() || 0;
        const end = parseUTCDate(runDetails.finished_at)?.getTime() || 0;
        const diff = Math.floor((end - start) / 1000);
        return diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)}m ${diff % 60}s`;
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8 min-h-0">
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DetailItem
                        icon={<Hash className="w-5 h-5" />}
                        label="Run ID"
                        value={runDetails.id}
                    />
                    <DetailItem
                        icon={<Layers className="w-5 h-5" />}
                        label="Scope"
                        value={runDetails.scope}
                    />
                    <DetailItem
                        icon={<Calendar className="w-5 h-5" />}
                        label="Created At"
                        value={formatDate(runDetails.created_at)}
                    />
                    <DetailItem
                        icon={<Clock className="w-5 h-5" />}
                        label="Duration"
                        value={duration()}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DetailItem
                        icon={<Cpu className="w-5 h-5" />}
                        label="LLM Model"
                        value={runDetails.llm_model?.display_name || runDetails.llm_model_id}
                    />
                    <DetailItem
                        icon={<User className="w-5 h-5" />}
                        label="Initiated by"
                        value={runDetails.user?.full_name || runDetails.user?.email || runDetails.user?.username}
                    />
                    <DetailItem
                        icon={<Globe className="w-5 h-5" />}
                        label="Base URL"
                        value={runDetails.base_url}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <FileText className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Instruction / Prompt</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap min-h-[100px]">
                            {runDetails.instruction || 'No specific instructions provided.'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Settings className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Run Options</span>
                            </div>
                            <div className="flex gap-4">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${runDetails.use_screenshots ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                    <Camera className="w-4 h-4" />
                                    <span className="text-xs font-bold">Screenshots {runDetails.use_screenshots ? 'ON' : 'OFF'}</span>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${runDetails.use_video ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                    <Video className="w-4 h-4" />
                                    <span className="text-xs font-bold">Video Recording {runDetails.use_video ? 'ON' : 'OFF'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                Technical Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job UID</span>
                                    <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded">{runDetails.job_uid}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mode</span>
                                    <span className="text-xs font-bold text-gray-600">{runDetails.mode}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
