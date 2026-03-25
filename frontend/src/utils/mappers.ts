import { ProjectDTO, Project } from "@/types/project";
import { TestSuiteDTO, TestSuite } from "@/types/test-suit";
import { TestCaseDTO, TestCase } from "@/types/test-case";
import { UserDTO, UserProfile, PasswordDTO, UpdatePasswordForm } from "@/types/user";
import { NotificationDTO, NotificationViewModel } from "@/types/notification";
import { DashboardDTO, DashboardData } from "@/types/dashboard";
export const mapProjectToViewModel = (dto: ProjectDTO): Project => ({
    id: String(dto.id),
    name: dto.name,
    description: dto.description,
    role: dto.user_role,
    isAdmin: dto.user_role === ('admin' as any),
    createdAt: dto.created_at,
    members: dto.members?.map(m => ({
        user: {
            id: String(m.user.id),
            firstName: m.user.first_name,
            lastName: m.user.last_name,
            email: m.user.email,
            isAdmin: m.user.is_admin
        },
        role: m.role,
        joinedAt: m.joined_at
    }))
});
export const mapTestSuiteToViewModel = (dto: TestSuiteDTO): TestSuite => ({
    id: String(dto.id),
    projectId: String(dto.project_id),
    name: dto.name,
    description: dto.description,
    createdAt: dto.created_at,
});
export const mapTestCaseToViewModel = (dto: TestCaseDTO): TestCase => ({
    id: String(dto.id),
    suiteId: String(dto.suite_id),
    name: dto.name,
    url: dto.url,
    mode: dto.mode,
    plainText: dto.plain_text,
    prompt: dto.prompt,
    steps: dto.steps,
    executionSteps: dto.execution_steps,
    status: dto.status,
    runVersion: dto.run_version,
    createdAt: dto.created_at,
});
export const mapUserToViewModel = (dto: UserDTO): UserProfile => ({
    fullName: `${dto.first_name || ''} ${dto.last_name || ''}`.trim() || 'User',
    username: dto.username || '',
    email: dto.email,
    avatarUrl: dto.avatar_url,
    bannerUrl: dto.banner_url,
    role: dto.role || 'Member',
    isAdmin: dto.is_admin || dto.role === 'admin',
    emailNotifications: dto.email_notifications ?? true,
    twoFactorEnabled: dto.two_factor_enabled ?? false,
});

export const mapProfileToDTO = (profile: Partial<UserProfile>): Partial<UserDTO> => {
    const dto: Partial<UserDTO> = {};

    if (profile.fullName !== undefined) {
        const names = profile.fullName.trim().split(/\s+/);
        dto.first_name = names[0] || "";
        dto.last_name = names.length > 1 ? names.slice(1).join(" ") : "";
    }

    if (profile.username !== undefined) dto.username = profile.username;
    if (profile.email !== undefined) dto.email = profile.email;
    if (profile.avatarUrl !== undefined) dto.avatar_url = profile.avatarUrl;
    if (profile.bannerUrl !== undefined) dto.banner_url = profile.bannerUrl;
    if (profile.role !== undefined) dto.role = profile.role;
    if (profile.isAdmin !== undefined) dto.is_admin = profile.isAdmin;
    if (profile.emailNotifications !== undefined) dto.email_notifications = profile.emailNotifications;
    if (profile.twoFactorEnabled !== undefined) dto.two_factor_enabled = profile.twoFactorEnabled;

    return dto;
};
export const mapPasswordToDTO = (form: UpdatePasswordForm): PasswordDTO => ({
    current_password: form.currentPassword,
    new_password: form.newPassword,
});
export const mapNotificationToViewModel = (dto: NotificationDTO): NotificationViewModel => ({
    id: dto.id,
    title: dto.title,
    description: dto.description,
    type: dto.type,
    time: dto.created_at,
    isRead: dto.is_read
});
export const mapDashboardToViewModel = (dto: DashboardDTO): DashboardData => ({
    metrics: {
        totalProjects: dto.metrics.total_projects,
        totalUsers: dto.metrics.total_users,
        executionRate: dto.metrics.execution_rate,
        systemLoad: dto.metrics.system_load,
        projectGrowth: dto.metrics.project_growth,
        userGrowth: dto.metrics.user_growth,
        executionGrowth: dto.metrics.execution_growth,
        loadGrowth: dto.metrics.load_growth,
    },
    projectHealth: dto.project_health,
    executionTrend: dto.execution_trend,
    globalSuccessRate: dto.global_success_rate,
});
