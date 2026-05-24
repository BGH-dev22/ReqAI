// Agent Types
export enum AgentStatus {
  IDLE = "idle",
  RUNNING = "running",
  COMPLETED = "completed",
  ERROR = "error",
  PAUSED = "paused",
}

export interface AgentProgress {
  agentName: string;
  status: AgentStatus;
  progress: number; // 0-100
  message?: string;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface MultiAgentState {
  documentId: string;
  status: AgentStatus;
  agents: Record<string, AgentProgress>;
  results: {
    parsing?: ParsingSAgentResult;
    analysis?: AnalysisAgentResult;
    qa?: QAAgentResult;
    citations?: CitationAgentResult;
    tests?: TestGeneratorAgentResult;
    export?: ExportAgentResult;
  };
}

export interface ParsingSAgentResult {
  extractedText: string;
  tables: Array<{
    title: string;
    rows: string[][];
  }>;
  sections: Section[];
  metadata: {
    totalPages: number;
    language: string;
    extractionQuality: number;
  };
}

export interface Section {
  title: string;
  pageNumber: number;
  startLine: number;
  endLine: number;
  content: string;
  level: number;
}

export interface AnalysisAgentResult {
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    pageNumber: number;
    section: string;
    sourceText: string;
  }>;
  totalRequirements: number;
  analysisQuality: number;
}

export interface QAAgentResult {
  question: string;
  answer: string;
  relevanceScore: number;
  processingTime: number; // ms
}

export interface CitationAgentResult {
  text: string;
  source: {
    page: number;
    section: string;
    startChar: number;
    endChar: number;
  };
  confidence: number; // 0-100
}

export interface TestGeneratorAgentResult {
  tests: Array<{
    id: string;
    title: string;
    type: string;
    steps: Array<{
      order: number;
      description: string;
      expectedResult: string;
    }>;
    preconditions: string[];
  }>;
  totalTests: number;
  coverage: number;
}

export interface ExportAgentResult {
  format: "excel" | "json" | "pdf" | "csv";
  fileSize: number;
  downloadUrl: string;
  expiresAt: Date;
}

export interface AgentError {
  agentName: string;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}
