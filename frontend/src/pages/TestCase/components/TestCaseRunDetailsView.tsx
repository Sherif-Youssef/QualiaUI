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
import { formatDate } from '@/utils/formatters';

interface TestCaseRunDetailsViewProps {
    runDetails: any;
}

const DetailCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}> = ({ icon, label, value }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2 text-gray-400">
            {icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-sm font-bold text-gray-900 break-all">
            {value || <span className="text-gray-300 font-normal italic">N/A</span>}
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
        const start = new Date(runDetails.started_at).getTime();
        const end = new Date(runDetails.finished_at).getTime();
        const diff = Math.floor((end - start) / 1000);
        return diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)}m ${diff % 60}s`;
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8 min-h-0">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DetailCard
                        icon={<Hash className="w-4 h-4" />}
                        label="Run ID"
                        value={runDetails.id}
                    />
                    <DetailCard
                        icon={<Layers className="w-4 h-4" />}
                        label="Scope"
                        value={runDetails.scope}
                    />
                    <DetailCard
                        icon={<Calendar className="w-4 h-4" />}
                        label="Created At"
                        value={formatDate(runDetails.created_at)}
                    />
                    <DetailCard
                        icon={<Clock className="w-4 h-4" />}
                        label="Duration"
                        value={duration()}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailCard
                        icon={<Cpu className="w-4 h-4" />}
                        label="LLM Model"
                        value={runDetails.llm_model?.display_name || runDetails.llm_model_id}
                    />
                    <DetailCard
                        icon={<User className="w-4 h-4" />}
                        label="Initiated by"
                        value={runDetails.user?.full_name || runDetails.user?.email || '--'}
                    />
                    <DetailCard
                        icon={<Globe className="w-4 h-4" />}
                        label="Base URL"
                        value={runDetails.base_url}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <FileText className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Instruction / Prompt</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
                            {runDetails.instruction || 'No specific instructions provided.'}
                        </div>
                    </div>

                    <div className="space-y-6">
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

                    </div>
                </div>
            </div>
        </div>
    );
};
