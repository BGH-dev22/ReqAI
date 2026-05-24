import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TraceabilityMatrix } from '@/components/TraceabilityMatrix';
import { FMEAAnalysis } from '@/components/FMEAAnalysis';
import { ComplianceCheck } from '@/components/ComplianceCheck';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader, TestTube2, CheckCircle2, FileText, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useDocumentContext } from '@/context/DocumentContext';
import { Link } from 'react-router-dom';

export function TestsPage() {
  const { documentId, requirements } = useDocumentContext();
  const canGenerate = Boolean(documentId) && requirements.length > 0;
  const { generateTests, error } = useAgents(documentId || '');

  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTests, setGeneratedTests] = useState<any[]>([]);
  const [traceabilityLinks, setTraceabilityLinks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'fmea' | 'compliance'>('tests');

  const disabledReason = useMemo(() => {
    if (!documentId) return "Aucun document actif. Uploadez un document d'abord.";
    if (requirements.length === 0) return "Aucune exigence extraite du document.";
    if (selectedRequirements.length === 0) return 'Sélectionnez au moins une exigence.';
    return null;
  }, [documentId, requirements.length, selectedRequirements.length]);

  const handleSelectRequirement = (reqId: string) => {
    setSelectedRequirements((prev) =>
      prev.includes(reqId)
        ? prev.filter((id) => id !== reqId)
        : [...prev, reqId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRequirements.length === requirements.length) {
      setSelectedRequirements([]);
    } else {
      setSelectedRequirements(requirements.map(r => r.id));
    }
  };

  const handleGenerateTests = async () => {
    if (!documentId || selectedRequirements.length === 0) return;

    setIsLoading(true);

    try {
      const selectedReqs = requirements
        .filter((r) => selectedRequirements.includes(r.id))
        .map((r) => ({
          id: r.id,
          titre: r.title,
          description: r.description,
          type: r.type,
          priorite: r.priority,
        }));
      const result = await generateTests(selectedReqs);
      setGeneratedTests(result.test_cases || result.tests || []);
      setTraceabilityLinks(result.traceability?.links || result.traceability || []);
    } catch (err) {
      console.error('Error generating tests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-slate-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 mb-6">
            <TestTube2 className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-slate-300">Test Generator</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Génération de Tests
            </span>
            <br />
            <span className="text-white">& Analyse FMEA</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Sélectionnez les exigences pour générer automatiquement des cas de test et analyser les risques
          </p>
          
          {/* Tabs */}
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'tests'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <TestTube2 className="inline-block w-5 h-5 mr-2" />
              Tests
            </button>
            <button
              onClick={() => setActiveTab('fmea')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'fmea'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="inline-block w-5 h-5 mr-2" />
              Analyse FMEA
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'compliance'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Shield className="inline-block w-5 h-5 mr-2" />
              Conformité
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {!canGenerate && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertDescription className="flex items-center justify-between text-amber-400">
              <span>
                {!documentId
                  ? "Aucun document n'est chargé. Uploadez un document pour extraire les exigences."
                  : "Aucune exigence n'a été extraite du document."}
              </span>
              <Link to="/upload" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                Aller à l'upload
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Tests Tab Content */}
        {activeTab === 'tests' && (
          <>
        {/* Requirements Selection */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Sélection des Exigences</h3>
                  <p className="text-sm text-slate-400">{requirements.length} exigences disponibles</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSelectAll}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {selectedRequirements.length === requirements.length ? 'Désélectionner tout' : 'Tout sélectionner'}
              </Button>
            </div>
          </div>
          
          <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
            {requirements.map((req) => (
              <div 
                key={req.id} 
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedRequirements.includes(req.id)
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => handleSelectRequirement(req.id)}
              >
                <Checkbox
                  id={req.id}
                  checked={selectedRequirements.includes(req.id)}
                  onCheckedChange={() => handleSelectRequirement(req.id)}
                  className="mt-1 border-slate-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <Label htmlFor={req.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{req.id}: {req.title}</span>
                    <Badge className={`text-xs ${
                      req.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                      req.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                      'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {req.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{req.description}</p>
                </Label>
              </div>
            ))}
            
            {requirements.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                Aucune exigence disponible. Uploadez et analysez un document.
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 p-6">
            <Button
              onClick={handleGenerateTests}
              disabled={!canGenerate || selectedRequirements.length === 0 || isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Générer les Tests ({selectedRequirements.length} sélectionnées)
                </>
              )}
            </Button>
            {disabledReason && (
              <p className="text-sm text-slate-500 mt-3 text-center">{disabledReason}</p>
            )}
          </div>
        </div>

        {/* Generated Tests */}
        {generatedTests.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Tests Générés</h3>
                  <p className="text-sm text-slate-400">{generatedTests.length} cas de test créés</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {generatedTests.map((test, idx) => {
                const preconditions = Array.isArray(test.preconditions)
                  ? test.preconditions
                  : typeof test.preconditions === 'string'
                  ? test.preconditions.split('\n').filter(Boolean)
                  : [];

                const steps = Array.isArray(test.steps)
                  ? test.steps
                  : typeof test.steps === 'string'
                  ? test.steps.split('\n').filter(Boolean).map((s: string) => ({ description: s, expectedResult: '' }))
                  : [];

                return (
                  <div key={idx} className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4 hover:border-green-500/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white">{test.id || `TEST-${idx + 1}`}: {test.title || test.name || 'Test'}</p>
                        <p className="text-sm text-slate-400 mt-1">{test.description}</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Généré
                      </Badge>
                    </div>

                    {preconditions.length > 0 && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-sm font-medium text-slate-300 mb-2">Préconditions:</p>
                        <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                          {preconditions.map((pre: string, pIdx: number) => (
                            <li key={pIdx}>{pre}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {steps.length > 0 && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-sm font-medium text-slate-300 mb-2">Étapes:</p>
                        <ol className="text-sm text-slate-400 list-decimal list-inside space-y-2">
                          {steps.map((step: any, sIdx: number) => (
                            <li key={sIdx}>
                              <span className="text-white">{typeof step === 'string' ? step : step.description}</span>
                              {step.expectedResult && (
                                <span className="text-green-400 ml-2">→ {step.expectedResult}</span>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700">
                        Éditer
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-green-400 hover:bg-slate-700">
                        Valider
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400 hover:bg-slate-700">
                        Supprimer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Traceability Matrix */}
        {activeTab === 'tests' && traceabilityLinks.length > 0 && (
          <TraceabilityMatrix
            links={traceabilityLinks}
            totalCoverage={traceabilityLinks.reduce((sum, link) => sum + link.coverage, 0) / traceabilityLinks.length}
          />
        )}
          </>
        )}

        {/* FMEA Analysis Tab */}
        {activeTab === 'fmea' && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden p-6">
            <FMEAAnalysis
              requirements={requirements.map(r => ({
                id: r.id,
                titre: r.title,
                description: r.description,
                type: r.type,
                priorite: r.priority,
              }))}
              systemContext="système industriel"
              industry="general"
              onExport={async (format, data) => {
                try {
                  const response = await fetch('http://localhost:8000/fmea/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      document_id: documentId || 'fmea-export',
                      payload: data,
                      format,
                    }),
                  });
                  if (response.ok) {
                    const result = await response.json();
                    // Télécharger le fichier
                    window.open(`http://localhost:8000/download/${result.download_url}`, '_blank');
                  }
                } catch (err) {
                  console.error('Export error:', err);
                }
              }}
            />
          </div>
        )}

        {/* Compliance Check Tab */}
        {activeTab === 'compliance' && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden p-6">
            <ComplianceCheck
              requirements={requirements.map(r => ({
                id: r.id,
                titre: r.title,
                description: r.description,
                type: r.type,
                priorite: r.priority,
              }))}
              onExport={async (format, data) => {
                try {
                  const response = await fetch('http://localhost:8000/compliance/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      document_id: documentId || 'compliance-export',
                      payload: data,
                      format,
                    }),
                  });
                  if (response.ok) {
                    const result = await response.json();
                    window.open(`http://localhost:8000/download/${result.download_url}`, '_blank');
                  }
                } catch (err) {
                  console.error('Export error:', err);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
