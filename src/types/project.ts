// Project Types
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
  documentsCount: number;
  requirementsCount: number;
  testsCount: number;
  metadata?: {
    industry?: string;
    domain?: string;
    version?: string;
  };
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  industry?: string;
  domain?: string;
}

export interface ProjectStats {
  projectId: string;
  documentsCount: number;
  requirementsCount: number;
  testsCount: number;
  averageRequirementsPerDocument: number;
  averageTestsPerRequirement: number;
  traceabilityCoverage: number; // 0-100
}

export interface ProjectExportSettings {
  includeRequirements: boolean;
  includeTests: boolean;
  includeTraceability: boolean;
  includeCharts: boolean;
  format: "excel" | "json" | "pdf";
}
