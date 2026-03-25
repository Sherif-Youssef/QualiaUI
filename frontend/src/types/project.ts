export interface ProjectDTO {
    id: number | string;
    name: string;
    description: string;
    user_role?: 'admin' | 'editor' | 'viewer' | 'guest';
    created_at?: string;
    members?: Array<{
        user: { id: number | string, first_name: string, last_name: string, email: string, is_admin?: boolean };
        role: 'admin' | 'editor' | 'viewer' | 'guest';
        joined_at: string;
    }>;
}

export interface TestSuiteDTO {
    id: number | string;
    project_id: number | string;
    name: string;
    description: string;
    created_at?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    role?: 'admin' | 'editor' | 'viewer' | 'guest';
    isAdmin: boolean;
    createdAt?: string;
    members?: Array<{
        user: { id: string, firstName: string, lastName: string, email: string, isAdmin?: boolean };
        role: 'admin' | 'editor' | 'viewer' | 'guest';
        joinedAt: string;
    }>;
}

export interface TestSuite {
    id: string;
    projectId: string;
    name: string;
    description: string;
    createdAt?: string;
}

