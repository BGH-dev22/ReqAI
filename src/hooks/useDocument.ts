import { useState, useCallback } from 'react';
import { Document, DocumentFormat, DocumentStatus, DocumentUploadProgress } from '@/types/document';
import { Requirement, RequirementType, RequirementPriority, RequirementStatus } from '@/types/requirement';
import { useDocumentContext } from '@/context/DocumentContext';
import { apiUrl } from '@/lib/api';

export function useDocument() {
  const { document, requirements, setDocument, setRequirements, setDocumentId } = useDocumentContext();
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Initialize upload progress
      setUploadProgress({
        documentId: '',
        fileName: file.name,
        progress: 0,
        status: DocumentStatus.UPLOADED,
      });

      // Simulate upload with XMLHttpRequest for progress tracking
      // In production, use fetch with progress events
      const response = await fetch(apiUrl('/upload'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const data = await response.json();

      // Adapter la réponse backend vers notre modèle Document
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const doc: Document = {
        id: data.document_id || data.filename || file.name,
        userId: 'local-user',
        fileName: data.filename || file.name,
        format: (ext as DocumentFormat) || DocumentFormat.PDF,
        size: data.size || file.size,
        status: DocumentStatus.ANALYZED,
        storageUrl: data.path || '',
        uploadedAt: new Date(),
        projectId: undefined,
      };

      // Mapper les exigences extraites par le backend
      const extractedRequirements: Requirement[] = (data.requirements || []).map(
        (req: any, index: number) => {
          const mapType = (t: string): RequirementType => {
            const v = (t || '').toLowerCase();
            if (v.includes('perf')) return RequirementType.PERFORMANCE;
            if (v.includes('séc') || v.includes('sec')) return RequirementType.SECURITY;
            return RequirementType.FUNCTIONAL;
          };
          const mapPriority = (p: string): RequirementPriority => {
            const v = (p || '').toLowerCase();
            if (v.startsWith('h') || v === 'haute') return RequirementPriority.HIGH;
            if (v.startsWith('b') || v === 'basse') return RequirementPriority.LOW;
            return RequirementPriority.MEDIUM;
          };
          return {
            id: req.id || `REQ-${String(index + 1).padStart(3, '0')}`,
            documentId: doc.id,
            title: req.titre || req.title || req.description?.slice(0, 50) || `Exigence ${index + 1}`,
            description: req.description || '',
            type: mapType(req.type),
            priority: mapPriority(req.priorite || req.priority),
            status: RequirementStatus.DRAFT,
            pageNumber: req.page_number || 1,
            section: req.section || '',
            sourceText: req.source || req.description || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      );

      setDocument(doc);
      setDocumentId(doc.id);
      setRequirements(extractedRequirements);

      setUploadProgress({
        documentId: doc.id,
        fileName: file.name,
        progress: 100,
        status: DocumentStatus.ANALYZED,
      });

      // Retourner le résultat pour le composant Chat
      return {
        document: doc,
        requirements: extractedRequirements,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Document upload error:', err);
      throw err; // Remonter l'erreur pour le catch dans Chat.tsx
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      await fetch(apiUrl(`/api/documents/${documentId}`), {
        method: 'DELETE',
      });
      setDocument(null);
      setRequirements([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }, []);

  const updateRequirement = useCallback(
    async (requirementId: string, updates: Partial<Requirement>) => {
      try {
        const response = await fetch(
          apiUrl(`/api/requirements/${requirementId}`),
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour');
        }

        const updated = await response.json();
        setRequirements((prev) =>
          prev.map((req) =>
            req.id === requirementId ? { ...req, ...updated } : req
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    },
    []
  );

  const deleteRequirement = useCallback(async (requirementId: string) => {
    try {
      await fetch(apiUrl(`/api/requirements/${requirementId}`), {
        method: 'DELETE',
      });
      setRequirements((prev) =>
        prev.filter((req) => req.id !== requirementId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }, []);

  return {
    document,
    requirements,
    uploadProgress,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    updateRequirement,
    deleteRequirement,
  };
}
