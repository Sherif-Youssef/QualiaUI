import { ProjectDTO, Project } from "@/types/project";
import { TestSuiteDTO, TestSuite } from "@/types/test-suit";
import { TestCaseDTO, TestCase } from "@/types/test-case";
import { UserDTO, UserProfile, PasswordDTO, UpdatePasswordForm } from "@/types/user";

// --- Project Mappers ---
export const mapProjectToViewModel = (dto: ProjectDTO): Project => ({
    id: dto.id,
    name: dto.name,
    description: dto.description,
    createdAt: dto.created_at,
});

// --- Test Suite Mappers ---
export const mapTestSuiteToViewModel = (dto: TestSuiteDTO): TestSuite => ({
    id: dto.id,
    projectId: dto.project_id,
    name: dto.name,
    description: dto.description,
    createdAt: dto.created_at,
});

// --- Test Case Mappers ---
export const mapTestCaseToViewModel = (dto: TestCaseDTO): TestCase => ({
    id: dto.id,
    suiteId: dto.suite_id,
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

// --- User Mappers ---
export const mapUserToViewModel = (dto: UserDTO): UserProfile => ({
    fullName: `${dto.first_name || ''} ${dto.last_name || ''}`.trim() || 'User',
    email: dto.email,
    avatarUrl: dto.avatar_url,
    bannerUrl: dto.banner_url,
    role: dto.role || 'Member',
    isAdmin: dto.is_admin,
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

    if (profile.email !== undefined) dto.email = profile.email;
    if (profile.avatarUrl !== undefined) dto.avatar_url = profile.avatarUrl;
    if (profile.bannerUrl !== undefined) dto.banner_url = profile.bannerUrl;
    if (profile.role !== undefined) dto.role = profile.role;
    if (profile.isAdmin !== undefined) dto.is_admin = profile.isAdmin;
    if (profile.emailNotifications !== undefined) dto.email_notifications = profile.emailNotifications;
    if (profile.twoFactorEnabled !== undefined) dto.two_factor_enabled = profile.twoFactorEnabled;

    return dto;
};

// --- Password Mappers ---
export const mapPasswordToDTO = (form: UpdatePasswordForm): PasswordDTO => ({
    current_password: form.currentPassword,
    new_password: form.newPassword,
    confirm_password: form.confirmPassword,
});
