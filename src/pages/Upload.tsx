import { useEffect, useMemo, useState } from 'react';
import { DocumentUploader } from '@/components/DocumentUploader';
import { MultiAgentProgress } from '@/components/MultiAgentProgress';
import { useDocument } from '@/hooks/useDocument';
import { useAgents } from '@/hooks/useAgents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Upload, FileText, CheckCircle2, Sparkles, ArrowRight, Clock, File } from 'lucide-react';
import { useDocumentContext } from '@/context/DocumentContext';

export function UploadPage() {
  const { document, requirements, uploadProgress, isLoading, error, uploadDocument } = useDocument();
  const { documentId } = useDocumentContext();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const { agentState, startParsing, startAnalysis, isProcessing } = useAgents(selectedDoc || '');

  const disabledReason = useMemo(() => {
    if (!documentId) return "Aucun document actif. Uploadez un document d'abord.";
    return null;
  }, [documentId]);

  useEffect(() => {
    if (documentId) {
      setSelectedDoc(documentId);
    }
  }, [documentId]);

  const handleFileSelected = async (file: File) => {
    await uploadDocument(file);
  };

  const handlePrepare = async () => {
    if (!selectedDoc) return;
    await startParsing();
    await startAnalysis();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-slate-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 mb-6">
            <Upload className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">Upload & Analyse</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Import & Analyse
            </span>
            <br />
            <span className="text-white">de Documents</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Téléchargez vos documents techniques pour que l'IA en extraie automatiquement les exigences
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Zone */}
        <DocumentUploader
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
          acceptedFormats={['.pdf', '.docx']}
          maxSize={10 * 1024 * 1024}
        />

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Statut du Téléchargement</h3>
                  <p className="text-sm text-slate-400">Progression en cours...</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-slate-400" />
                <span className="font-medium text-white">{uploadProgress.fileName}</span>
              </div>
              
              <div className="relative">
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-full animate-pulse" style={{ width: `${uploadProgress.progress}%` }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{uploadProgress.progress}%</span>
                <Badge className={`${uploadProgress.progress === 100 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                  {uploadProgress.status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Button 
            onClick={handlePrepare} 
            disabled={!documentId || isProcessing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 h-12 px-8"
          >
            {isProcessing ? (
              <>
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                Préparation en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Préparer le document (ingest + analyse)
              </>
            )}
          </Button>
          {disabledReason && (
            <p className="text-sm text-slate-500">{disabledReason}</p>
          )}
        </div>

        {/* Multi-Agent Progress */}
        {agentState && (
          <MultiAgentProgress
            agents={Object.values(agentState.agents)}
          />
        )}

        {/* Extracted Requirements */}
        {requirements.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-b border-slate-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Exigences Extraites</h3>
                    <p className="text-sm text-slate-400">{requirements.length} exigences détectées</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Terminé
                </Badge>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {requirements.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{req.id}: {req.title}</p>
                        <p className="text-xs text-slate-500">Page {req.pageNumber}, {req.section}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-slate-700 text-slate-300 border-slate-600">{req.type}</Badge>
                      <Badge className={`
                        ${req.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                          req.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                          'bg-slate-700 text-slate-300 border-slate-600'}
                      `}>
                        {req.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">{req.description}</p>
                  <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700">
                      Éditer
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400 hover:bg-slate-700">
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
              
              {requirements.length > 5 && (
                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Afficher les {requirements.length - 5} exigences restantes
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Document Info */}
        {document && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="font-semibold text-white">Informations du Document</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Nom</p>
                  <p className="font-medium text-white">{document.fileName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Taille</p>
                  <p className="font-medium text-white">{(document.size / 1024 / 1024).toFixed(2)} Mo</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Pages</p>
                  <p className="font-medium text-white">{document.totalPages || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Langue</p>
                  <p className="font-medium text-white">{document.language || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Statut</p>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{document.status}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Uploadé le</p>
                  <p className="font-medium text-white">{new Date(document.uploadedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
