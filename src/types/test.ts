// Test Types
export enum TestStatus {
  DRAFT = "draft",
  READY = "ready",
  PASSED = "passed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export enum TestType {
  UNIT = "unit",
  INTEGRATION = "integration",
  SYSTEM = "system",
  ACCEPTANCE = "acceptance",
  PERFORMANCE = "performance",
  SECURITY = "security",
}

export interface TestPrecondition {
  description: string;
  command?: string;
}

export interface TestStep {
  order: number;
  description: string;
  expectedResult: string;
  notes?: string;
}

export interface TestCase {
  id: string; // TEST-001 format
  requirementId: string; // REQ-001
  title: string;
  description: string;
  type: TestType;
  status: TestStatus;
  preconditions: TestPrecondition[];
  steps: TestStep[];
  expectedResult: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  coverage?: number; // 0-100
}

export interface TraceabilityLink {
  requirementId: string;
  testIds: string[];
  coverage: number; // 0-100
  verified: boolean;
}

export interface TraceabilityMatrix {
  documentId: string;
  links: TraceabilityLink[];
  totalCoverage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestGenerationInput {
  requirementIds: string[];
  testTypes: TestType[];
  maxTestsPerRequirement?: number;
}
