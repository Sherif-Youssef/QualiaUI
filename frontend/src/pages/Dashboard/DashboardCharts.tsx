import React from 'react';
import Chart from "@/components/Dashboard/Chart";
import { projectHealthData, executionTrendData, globalSuccessData } from "@/components/Dashboard/DashboardData";

interface DashboardChartsProps {
    isLoading: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ isLoading }) => {
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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Chart
                        type="stacked-bar"
                        title="Project Success Distribution"
                        subtitle="Detailed breakdown of test results per active project"
                        data={projectHealthData}
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
                    data={executionTrendData}
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
