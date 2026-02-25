import React from 'react';
import { Layers, Users, TrendingUp, Circle } from 'lucide-react';
import { StateCard } from "@/components/Dashboard/StateCard";

interface DashboardMetricsProps {
    isLoading: boolean;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ isLoading }) => {
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
                value="128"
                percentage="+12%"
                type="up"
                icon={<Layers size={20} />}
            />
            <StateCard
                title="Total Users"
                value="1,024"
                percentage="+5%"
                type="up"
                icon={<Users size={20} />}
            />
            <StateCard
                title="Execution Rate"
                value="98.2%"
                percentage="+1.2%"
                type="up"
                icon={<TrendingUp size={20} />}
            />
            <StateCard
                title="System Load"
                value="24%"
                percentage="-2%"
                type="down"
                icon={<Circle size={20} />}
            />
        </div>
    );
};
