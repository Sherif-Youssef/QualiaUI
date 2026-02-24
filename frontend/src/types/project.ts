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
