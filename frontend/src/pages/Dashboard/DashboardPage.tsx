import React, { useState, useEffect } from "react";
import { Circle } from "lucide-react";

import { DashboardLayout } from "./DashboardLayout";
import { DashboardMetrics } from "./DashboardMetrics";
import { DashboardCharts } from "./DashboardCharts";
import { dashboardService } from "@/services/dashboardService";
import { DashboardData } from "@/types/dashboard";
import { authService } from "@/services/auth/auth";

export const DashboardPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [userName, setUserName] = useState<string>("");

    const fetchAllData = async () => {
        try {
            setIsLoading(true);
            const [data, user] = await Promise.all([
                dashboardService.getDashboardData(),
                authService.getCurrentUser()
            ]);
            setDashboardData(data);
            setUserName(user?.first_name || "Admin");
            setError(null);
        } catch (err) {
            console.error("Error loading dashboard data:", err);
            setError("Failed to load dashboard metrics. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
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
                        onClick={fetchAllData}
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
                    <h1 className="text-3xl font-sans font-black text-gray-800 tracking-tight leading-none">
                        Welcome back, {userName}!
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium text-lg">Real-time status and health of all managed projects</p>
                </div>
            }
            metrics={<DashboardMetrics isLoading={isLoading} metrics={dashboardData?.metrics} />}
            charts={
                <DashboardCharts
                    isLoading={isLoading}
                    projectHealth={dashboardData?.projectHealth}
                    executionTrend={dashboardData?.executionTrend}
                    globalSuccessRate={dashboardData?.globalSuccessRate}
                />
            }
        />
    );
};

export default DashboardPage;


