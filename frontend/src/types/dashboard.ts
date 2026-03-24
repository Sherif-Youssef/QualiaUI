export interface DashboardMetrics {
    totalProjects: number;
    totalUsers: number;
    executionRate: number;
    systemLoad: number;
    projectGrowth: number;
    userGrowth: number;
    executionGrowth: number;
    loadGrowth: number;
}

export interface ProjectHealth {
    projectName: string;
    passed: number;
    failed: number;
    error: number;
}

export interface ExecutionTrend {
    date: string;
    runs: number;
}

export interface DashboardData {
    metrics: DashboardMetrics;
    projectHealth: ProjectHealth[];
    executionTrend: ExecutionTrend[];
    globalSuccessRate: number;
}

export interface DashboardDTO {
    metrics: {
        total_projects: number;
        total_users: number;
        execution_rate: number;
        system_load: number;
        project_growth: number;
        user_growth: number;
        execution_growth: number;
        load_growth: number;
    };
    project_health: ProjectHealth[];
    execution_trend: ExecutionTrend[];
    global_success_rate: number;
}
