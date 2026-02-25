// DTOs (Data Transfer Objects) - match backend snake_case
export interface ProjectDTO {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

export interface TestSuiteDTO {
    id: string;
    project_id: string;
    name: string;
    description: string;
    created_at: string;
}

// View Models - match frontend camelCase
export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
}

export interface TestSuite {
    id: string;
    projectId: string;
    name: string;
    description: string;
    createdAt: string;
}
