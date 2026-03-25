import React from 'react';
import { Layers, Users, TrendingUp, Circle } from 'lucide-react';
import { StateCard } from "@/components/Dashboard/StateCard";
import { DashboardMetrics as DashboardMetricsType } from '@/types/dashboard';

interface DashboardMetricsProps {
    isLoading: boolean;
    metrics?: DashboardMetricsType;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ isLoading, metrics }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm animate-pulse h-32" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StateCard
                title="Total Projects"
                value={metrics?.totalProjects.toString() || "0"}
                percentage={`${(metrics?.projectGrowth ?? 0) > 0 ? '+' : ''}${(metrics?.projectGrowth ?? 0).toFixed(1)}%`}
                type={(metrics?.projectGrowth ?? 0) >= 0 ? "up" : "down"}
                icon={<Layers size={20} />}
            />
            <StateCard
                title="Total Users"
                value={metrics?.totalUsers.toString() || "0"}
                percentage={`${(metrics?.userGrowth ?? 0) > 0 ? '+' : ''}${(metrics?.userGrowth ?? 0).toFixed(1)}%`}
                type={(metrics?.userGrowth ?? 0) >= 0 ? "up" : "down"}
                icon={<Users size={20} />}
            />
            <StateCard
                title="Execution Rate"
                value={`${(metrics?.executionRate ?? 0).toFixed(1)}%` || "0%"}
                percentage={`${(metrics?.executionGrowth ?? 0) > 0 ? '+' : ''}${(metrics?.executionGrowth ?? 0).toFixed(1)}%`}
                type={(metrics?.executionGrowth ?? 0) >= 0 ? "up" : "down"}
                icon={<TrendingUp size={20} />}
            />
            <StateCard
                title="System Load"
                value={`${(metrics?.systemLoad ?? 0).toFixed(0)}%` || "0%"}
                percentage={`${(metrics?.loadGrowth ?? 0) > 0 ? '+' : ''}${(metrics?.loadGrowth ?? 0).toFixed(1)}%`}
                type={(metrics?.loadGrowth ?? 0) >= 0 ? "up" : "down"}
                icon={<Circle size={20} />}
            />
        </div>
    );
};


