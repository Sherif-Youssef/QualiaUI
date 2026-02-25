import React, { useState, useEffect } from "react";
import { Circle } from "lucide-react";

// Sub-components
import { DashboardLayout } from "./DashboardLayout";
import { DashboardMetrics } from "./DashboardMetrics";
import { DashboardCharts } from "./DashboardCharts";

export const DashboardPage: React.FC = () => {
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
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-failure/10 max-w-md animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-failure/10 rounded-[32px] flex items-center justify-center text-failure mx-auto mb-6">
                        <Circle size={40} />
                    </div>
                    <h2 className="text-2xl font-sans font-black text-gray-800 mb-2">Oops! Connection Issue</h2>
                    <p className="text-muted-foreground font-medium mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={() => { setError(null); setIsLoading(true); }}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            header={
                <div>
                    <h1 className="text-3xl font-sans font-black text-gray-800 tracking-tight leading-none">Organization Overview</h1>
                    <p className="text-muted-foreground mt-2 font-medium text-lg">Real-time status and health of all managed projects</p>
                </div>
            }
            metrics={<DashboardMetrics isLoading={isLoading} />}
            charts={<DashboardCharts isLoading={isLoading} />}
        />
    );
};

export default DashboardPage;
