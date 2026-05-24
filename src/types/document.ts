// Document Types
export enum DocumentStatus {
  UPLOADED = "uploaded",
  PARSING = "parsing",
  PARSED = "parsed",
  ANALYZING = "analyzing",
  ANALYZED = "analyzed",
  ERROR = "error",
}

export enum DocumentFormat {
  PDF = "pdf",
  DOCX = "docx",
  TXT = "txt",
}

export interface Document {
  id: string;
  userId: string;
  projectId?: string;
  fileName: string;
  format: DocumentFormat;
  size: number; // bytes
  status: DocumentStatus;
  storageUrl: string;
  totalPages?: number;
  language?: string;
  uploadedAt: Date;
  processedAt?: Date;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export interface DocumentUploadProgress {
  documentId: string;
  fileName: string;
  progress: number; // 0-100
  status: DocumentStatus;
  message?: string;
}

export interface DocumentAnalysisResult {
  documentId: string;
  requirementsCount: number;
  extractedText: string;
  sections: number;
  analysisQuality: number;
  processingTime: number; // seconds
}

export interface DocumentCreateInput {
  fileName: string;
  format: DocumentFormat;
  size: number;
}
