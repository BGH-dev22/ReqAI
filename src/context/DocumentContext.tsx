import { createContext, useContext, useState, ReactNode } from 'react';
import { Document } from '@/types/document';
import { Requirement } from '@/types/requirement';

interface DocumentContextValue {
  documentId: string | null;
  document: Document | null;
  requirements: Requirement[];
  setDocumentId: (id: string | null) => void;
  setDocument: (doc: Document | null) => void;
  setRequirements: (reqs: Requirement[]) => void;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(undefined);

interface DocumentProviderProps {
  children: ReactNode;
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documentId, setDocumentId] = useState<string | null>(null);

  return (
    <DocumentContext.Provider
      value={{ documentId, document, requirements, setDocumentId, setDocument, setRequirements }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocumentContext(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return ctx;
}
