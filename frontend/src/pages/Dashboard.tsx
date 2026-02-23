import { StateCard } from "@/components/Dashboard/StateCard";
import { Circle, TrendingUp, Layers, Users } from "lucide-react";
import { projectHealthData, executionTrendData, globalSuccessData } from "@/components/Dashboard/DashboardData";
import Chart from "@/components/Dashboard/Chart";

const Dashboard = () => {
    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Organization Overview</h1>
                <p className="text-gray-500 mt-1 font-medium">Real-time status and health of all managed projects</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StateCard
                    title="Total Projects"
                    value="128"
                    percentage="+12%"
                    type="up"
                    icon={<Layers size={20} className="text-blue-600" />}
                />
                <StateCard
                    title="Total Users"
                    value="1,024"
                    percentage="+5%"
                    type="up"
                    icon={<Users size={20} className="text-purple-600" />}
                />
                <StateCard
                    title="Execution Rate"
                    value="98.2%"
                    percentage="+1.2%"
                    type="up"
                    icon={<TrendingUp size={20} className="text-green-600" />}
                />
                <StateCard
                    title="System Load"
                    value="24%"
                    percentage="-2%"
                    type="down"
                    icon={<Circle size={20} className="text-orange-600" />}
                />
            </div>
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
                                { key: 'passed', color: '#2563EB', label: 'Passed' },
                                { key: 'failed', color: '#EF4444', label: 'Failed' },
                                { key: 'error', color: '#F59E0B', label: 'Error' }
                            ]
                        }}
                    />
                </div>
                <Chart
                    type="donut"
                    title="Global Success Rate"
                    subtitle="Average performance across all projects"
                    data={globalSuccessData}
                    dimensions={{ height: 350 }}
                />
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
                        color: '#6366F1'
                    }}
                />
            </div>
        </div>
    );
};

export default Dashboard;