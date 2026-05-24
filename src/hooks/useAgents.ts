import { useState, useCallback } from 'react';
import { AgentProgress, AgentStatus, MultiAgentState } from '@/types/agent';
import { apiUrl } from '@/lib/api';

// État global pour le modèle LLM sélectionné
let currentLLMProvider = 'groq'; // default

export function setGlobalLLMProvider(provider: string) {
  currentLLMProvider = provider;
}

export function getGlobalLLMProvider() {
  return currentLLMProvider;
}

export function useAgents(documentId: string) {
  const [agentState, setAgentState] = useState<MultiAgentState>({
    documentId,
    status: AgentStatus.IDLE,
    agents: {
      parsing: {
        agentName: 'ParsingAgent',
        status: AgentStatus.IDLE,
        progress: 0,
      },
      analysis: {
        agentName: 'AnalysisAgent',
        status: AgentStatus.IDLE,
        progress: 0,
      },
      qa: {
        agentName: 'QAAgent',
        status: AgentStatus.IDLE,
        progress: 0,
      },
      citation: {
        agentName: 'CitationAgent',
        status: AgentStatus.IDLE,
        progress: 0,
      },
      tests: {
        agentName: 'TestGeneratorAgent',
        status: AgentStatus.IDLE,
        progress: 0,
      },
      export: {
        agentName: 'ExportAgent',
        status: AgentStatus.IDLE,
        progress: 0,
      },
    },
    results: {},
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDocId = useCallback(
    (id: string) =>
      setAgentState((prev) => ({
        ...prev,
        documentId: id,
      })),
    []
  );

  const updateAgentProgress = useCallback(
    (agentName: string, progress: number, status: AgentStatus, message?: string) => {
      setAgentState((prev) => ({
        ...prev,
        agents: {
          ...prev.agents,
          [agentName]: {
            ...prev.agents[agentName as keyof typeof prev.agents],
            progress,
            status,
            message,
          },
        },
      }));
    },
    []
  );

  const startParsing = useCallback(async () => {
    // Le parsing est déjà effectué lors de l'upload via /upload
    // Cette fonction est conservée pour compatibilité mais n'effectue plus d'appel API
    updateAgentProgress('parsing', 100, AgentStatus.COMPLETED, 'Parsing effectué lors de l\'upload');
  }, [updateAgentProgress]);

  const startAnalysis = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      updateAgentProgress('analysis', 0, AgentStatus.RUNNING, 'Analyse en cours...');

      const response = await fetch(apiUrl('/workflow/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse');
      }

      const result = await response.json();
      if (result?.document_id) {
        updateDocId(result.document_id);
      }
      updateAgentProgress('analysis', 100, AgentStatus.COMPLETED);

      setAgentState((prev) => ({
        ...prev,
        results: { ...prev.results, analysis: result },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      updateAgentProgress('analysis', 0, AgentStatus.ERROR, errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [documentId, updateAgentProgress]);

  const askQuestion = useCallback(
    async (question: string) => {
      setError(null);

      try {
        const response = await fetch(apiUrl('/qa'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            document_id: documentId, 
            question,
            llm_provider: currentLLMProvider,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la recherche');
        }

        return await response.json();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        throw err;
      }
    },
    [documentId]
  );

  const generateTests = useCallback(
    async (requirements: any[]) => {
      setIsProcessing(true);
      setError(null);

      try {
        updateAgentProgress('tests', 0, AgentStatus.RUNNING, 'Génération en cours...');

        const response = await fetch(apiUrl('/generate-tests'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId,
            requirements: requirements,
            llm_provider: currentLLMProvider,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la génération des tests');
        }

        const result = await response.json();
        updateAgentProgress('tests', 100, AgentStatus.COMPLETED);

        setAgentState((prev) => ({
          ...prev,
          results: { ...prev.results, tests: result },
        }));

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        updateAgentProgress('tests', 0, AgentStatus.ERROR, errorMessage);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [documentId, updateAgentProgress]
  );

  const exportData = useCallback(
    async (format: 'excel' | 'json' | 'pdf' | 'csv') => {
      setIsProcessing(true);
      setError(null);

      try {
        updateAgentProgress('export', 0, AgentStatus.RUNNING, 'Génération de l\'export...');

        const response = await fetch(apiUrl('/export'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: documentId,
            payload: {},
            format,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'export');
        }

        const result = await response.json();
        updateAgentProgress('export', 100, AgentStatus.COMPLETED);

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        updateAgentProgress('export', 0, AgentStatus.ERROR, errorMessage);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [documentId, updateAgentProgress]
  );

  return {
    agentState,
    isProcessing,
    error,
    updateAgentProgress,
    startParsing,
    startAnalysis,
    askQuestion,
    generateTests,
    exportData,
  };
}
