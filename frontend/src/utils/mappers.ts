import { ProjectDTO, Project } from "@/types/project";
import { TestSuiteDTO, TestSuite } from "@/types/test-suit";
import { TestCaseDTO, TestCase, ActionStep } from "@/types/test-case";
import { UserDTO, UserProfile, PasswordDTO, UpdatePasswordForm } from "@/types/user";
import { NotificationDTO, NotificationViewModel } from "@/types/notification";
import { DashboardDTO, DashboardData } from "@/types/dashboard";
import { TestCaseRun, TestStepRun } from "@/types/run";

export const mapTestStepRunToActionStep = (sr: TestStepRun, index: number): ActionStep => {
    const actionText = sr.llm_action || 'Action Step';

    const screenshot = sr.screenshot_after || sr.screenshot_before;

    return {
        id: sr.id.toString(),
        number: index + 1,
        text: actionText,
        screenshot: screenshot ? (screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`) : '',
        status: sr.status === 'PASSED' ? 'success' : 'failure' as any,
        description: sr.error_message || undefined
    };
};

export const mapTestCaseRunToViewModel = (cr: TestCaseRun, steps: TestStepRun[] = []): TestCase => {
    const statusMapping: Record<string, TestCase['status']> = {
        'PASSED': 'success',
        'FAILED': 'failure',
        'ABORTED': 'failure',
        'ERROR': 'failure'
    };

    return {
        id: cr.id.toString(),
        suiteId: '',
        name: cr.name || `Test Case ${cr.id}`,
        prompt: cr.instruction || '',
        status: statusMapping[cr.status] || 'idle',
        url: cr.base_url,
        mode: 'plain',
        steps: steps.map((sr, idx) => mapTestStepRunToActionStep(sr, idx))
    };
};

export const mapActiveStepToActionStep = (stepRun: any, currentStepCount: number): ActionStep => {
    const screenshot = stepRun.screenshot_after || stepRun.screenshot_before || (stepRun.snapshot_after ? stepRun.snapshot_after.screenshot : '') || (stepRun.snapshot_before ? stepRun.snapshot_before.screenshot : '');
    
    let formattedScreenshot = '';
    if (screenshot) {
        if (screenshot.startsWith('http') || screenshot.startsWith('data:')) {
            formattedScreenshot = screenshot;
        } else {
            formattedScreenshot = `data:image/png;base64,${screenshot}`;
        }
    }

    return {
        id: crypto.randomUUID(),
        number: currentStepCount + 1,
        text: stepRun.llm_action || stepRun.action_description || 'Executing Action...',
        screenshot: formattedScreenshot,
        type: 'do',
    };
};

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
    suiteId: String(dto.testsuite_id),
    name: dto.name,
    description: dto.description,
    url: dto.base_url || '',
    mode: (dto.executable_steps && dto.executable_steps.length > 0) ? 'step-based' : 'plain',
    plainText: dto.instruction || '',
    prompt: dto.instruction || '',
    steps: (dto.executable_steps || []).map(s => ({ ...s, id: String(s.id) })),
    executionSteps: (dto.executable_steps || []).map(s => ({ ...s, id: String(s.id) })),
    status: dto.status || 'idle',
    runVersion: dto.run_version,
    createdAt: dto.created_at,
});
export const mapUserToViewModel = (dto: UserDTO): UserProfile => ({
    id: String(dto.id),
    fullName: `${dto.first_name || ''} ${dto.last_name || ''}`.trim() || 'User',
    username: dto.username || '',
    email: dto.email,
    avatarUrl: dto.avatar_url,
    bannerUrl: dto.banner_url,
    role: dto.role || 'Member',
    isAdmin: dto.is_admin || dto.role === 'admin',
    isActive: dto.is_active !== false,
    isTempPass: !!dto.is_temp_pass,
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
