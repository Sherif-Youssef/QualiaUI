import React from 'react';
import Chart from "@/components/Dashboard/Chart";
import { ProjectHealth, ExecutionTrend } from '@/types/dashboard';

interface DashboardChartsProps {
    isLoading: boolean;
    projectHealth?: ProjectHealth[];
    executionTrend?: ExecutionTrend[];
    globalSuccessRate?: number;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
    isLoading,
    projectHealth,
    executionTrend,
    globalSuccessRate = 0
}) => {
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm h-[450px] animate-pulse" />
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm h-[450px] animate-pulse" />
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm h-[500px] animate-pulse" />
            </div>
        );
    }

    const globalSuccessData = [
        { name: 'Success', value: globalSuccessRate, color: '#33b281' },
        { name: 'Failure', value: Math.max(0, 100 - globalSuccessRate), color: '#f22626' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Chart
                        type="stacked-bar"
                        title="Project Success Distribution"
                        subtitle="Detailed breakdown of test results per active project"
                        data={projectHealth || []}
                        dimensions={{ height: 350 }}
                        config={{
                            xAxisKey: 'projectName',
                            bars: [
                                { key: 'passed', color: '#33b281', label: 'Passed' },
                                { key: 'failed', color: '#f22626', label: 'Failed' },
                                { key: 'error', color: '#faa01f', label: 'Error' }
                            ]
                        }}
                    />
                </div>
                <div>
                    <Chart
                        type="donut"
                        title="Global Success Rate"
                        subtitle="Average performance across all projects"
                        data={globalSuccessData}
                        dimensions={{ height: 350 }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Chart
                    type="area-trend"
                    title="Execution Activity Trend"
                    subtitle="Daily test execution volume over the last week"
                    data={executionTrend || []}
                    dimensions={{ height: 400 }}
                    config={{
                        xAxisKey: 'date',
                        dataKey: 'runs',
                        color: '#0ea5e9'
                    }}
                />
            </div>
        </div>
    );
};

