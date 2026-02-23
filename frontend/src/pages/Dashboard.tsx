import { StateCard } from "@/components/Dashboard/StateCard";
import { Circle, TrendingUp, Layers, Users } from "lucide-react";
import { projectHealthData, executionTrendData, globalSuccessData } from "@/components/Dashboard/DashboardData";
import Chart from "@/components/Dashboard/Chart";
import { useState, useEffect } from "react";

const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (Math.random() < 0.1) {
                setError("Failed to load dashboard metrics. Please try again later.");
            }
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
                <div className="bg-failure/5 p-8 rounded-lg border border-failure/10 max-w-md animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-failure/10 rounded-2xl flex items-center justify-center text-failure mx-auto mb-4">
                        <Circle size={32} />
                    </div>
                    <h2 className="text-headline-md font-sans font-bold text-foreground mb-2">Oops! Something went wrong</h2>
                    <p className="text-muted-foreground font-body text-body-md mb-6">{error}</p>
                    <button
                        onClick={() => { setError(null); setIsLoading(true); }}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-background min-h-full">
            <div>
                <h1 className="text-headline-xl font-sans font-bold text-foreground tracking-tight">Organization Overview</h1>
                <p className="text-muted-foreground mt-1 font-body text-body-lg font-medium">Real-time status and health of all managed projects</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    isLoading ? (
                        <div key={i} className="bg-card p-6 rounded-lg border border-border shadow-sm animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-muted rounded-xl"></div>
                                <div className="w-12 h-6 bg-muted rounded-lg"></div>
                            </div>
                            <div className="w-20 h-4 bg-muted rounded mb-2"></div>
                            <div className="w-24 h-8 bg-muted rounded-lg"></div>
                        </div>
                    ) : null
                ))}

                {!isLoading && (
                    <>
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
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {isLoading ? (
                        <div className="bg-card p-6 rounded-lg border border-border shadow-sm h-[450px] animate-pulse flex flex-col">
                            <div className="w-48 h-6 bg-muted rounded mb-2"></div>
                            <div className="w-64 h-4 bg-muted rounded mb-8"></div>
                            <div className="flex-1 w-full bg-muted/50 rounded-xl"></div>
                        </div>
                    ) : (
                        <Chart
                            type="stacked-bar"
                            title="Project Success Distribution"
                            subtitle="Detailed breakdown of test results per active project"
                            data={projectHealthData}
                            dimensions={{ height: 350 }}
                            config={{
                                xAxisKey: 'projectName',
                                bars: [
                                    { key: 'passed', color: '#10b981', label: 'Passed' },
                                    { key: 'failed', color: '#ef4444', label: 'Failed' },
                                    { key: 'error', color: '#f59e0b', label: 'Error' }
                                ]
                            }}
                        />
                    )}
                </div>
                {isLoading ? (
                    <div className="bg-card p-6 rounded-lg border border-border shadow-sm h-[450px] animate-pulse flex flex-col">
                        <div className="w-48 h-6 bg-muted rounded mb-2"></div>
                        <div className="w-64 h-4 bg-muted rounded mb-8"></div>
                        <div className="flex-1 w-full bg-muted/50 rounded-full aspect-square mx-auto max-w-[250px]"></div>
                    </div>
                ) : (
                    <Chart
                        type="donut"
                        title="Global Success Rate"
                        subtitle="Average performance across all projects"
                        data={globalSuccessData}
                        dimensions={{ height: 350 }}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                    <div className="bg-card p-6 rounded-lg border border-border shadow-sm h-[500px] animate-pulse flex flex-col">
                        <div className="w-48 h-6 bg-muted rounded mb-2"></div>
                        <div className="w-64 h-4 bg-muted rounded mb-8"></div>
                        <div className="flex-1 w-full bg-muted/50 rounded-xl"></div>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
};

export default Dashboard;