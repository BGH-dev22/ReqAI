// Agent API client
export async function callParsingAgent(documentId: string) {
  const response = await fetch('/api/agents/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors du parsing');
  }

  return response.json();
}

export async function callAnalysisAgent(documentId: string) {
  const response = await fetch('/api/agents/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'analyse');
  }

  return response.json();
}

export async function callQAAgent(documentId: string, question: string) {
  const response = await fetch('/api/agents/qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, question }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la recherche');
  }

  return response.json();
}

export async function callTestGeneratorAgent(
  documentId: string,
  requirementIds: string[]
) {
  const response = await fetch('/api/agents/generate-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, requirementIds }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la génération des tests');
  }

  return response.json();
}

export async function callExportAgent(
  documentId: string,
  format: 'excel' | 'json' | 'pdf' | 'csv'
) {
  const response = await fetch('/api/agents/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, format }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'export');
  }

  return response.json();
}
