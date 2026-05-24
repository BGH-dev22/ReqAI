// Requirement Types
export enum RequirementType {
  FUNCTIONAL = "functional",
  PERFORMANCE = "performance",
  SECURITY = "security",
  RELIABILITY = "reliability",
  USABILITY = "usability",
  COMPATIBILITY = "compatibility",
}

export enum RequirementPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum RequirementStatus {
  DRAFT = "draft",
  APPROVED = "approved",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export interface Requirement {
  id: string; // REQ-001 format
  documentId: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  pageNumber: number;
  section: string;
  sourceText: string; // Citation originale
  createdAt: Date;
  updatedAt: Date;
  linkedTests?: string[]; // IDs des tests liés
  metadata?: {
    confidence?: number; // 0-100
    keywords?: string[];
    relatedReqs?: string[];
  };
}

export interface RequirementCreateInput {
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  documentId: string;
  pageNumber: number;
  section: string;
  sourceText: string;
}

export interface RequirementUpdateInput {
  title?: string;
  description?: string;
  type?: RequirementType;
  priority?: RequirementPriority;
  status?: RequirementStatus;
  section?: string;
  sourceText?: string;
}
