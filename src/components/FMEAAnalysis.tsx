/**
 * FMEAAnalysis - Composant d'analyse FMEA (Failure Mode and Effects Analysis)
 * Affiche les modes de défaillance, calcule les RPN et propose des actions correctives
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp, Download, RefreshCw, Save, History, Trash2, Clock, X } from 'lucide-react';
import { useSavedAnalyses, SavedFMEAAnalysis, FMEAItem as SavedFMEAItem } from '@/hooks/useSavedAnalyses';

interface FMEAItem {
  id: string;
  requirement_id: string;
  requirement_title: string;
  function: string;
  failure_mode: string;
  failure_effect: string;
  failure_cause: string;
  severity: number;
  severity_desc: string;
  occurrence: number;
  occurrence_desc: string;
  detection: number;
  detection_desc: string;
  rpn: number;
  risk_level: string;
  current_controls: string;
  recommended_actions: string[];
  action_owner: string;
  target_date: string;
  status: string;
}

interface FMEAStatistics {
  total_items: number;
  by_risk_level: Record<string, number>;
  average_rpn: number;
  max_rpn: number;
  min_rpn: number;
  critical_items: Array<{ id: string; requirement_id: string; failure_mode: string; rpn: number }>;
  top_5_rpn: Array<{ id: string; failure_mode: string; rpn: number }>;
  action_required_count: number;
}

interface FMEAData {
  fmea_items: FMEAItem[];
  statistics: FMEAStatistics;
  metadata: {
    system_context: string;
    industry: string;
    total_requirements: number;
    total_failure_modes: number;
  };
}

interface FMEAAnalysisProps {
  requirements: Array<{
    id?: string;
    ID?: string;
    titre?: string;
    Titre?: string;
    title?: string;
    description?: string;
    Description?: string;
    type?: string;
    Type?: string;
  }>;
  systemContext?: string;
  industry?: string;
  onExport?: (format: string, data: FMEAData) => void;
}

// Couleurs selon le niveau de risque
const riskColors: Record<string, { bg: string; text: string; border: string }> = {
  critique: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
  majeur: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  'modéré': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  mineur: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  acceptable: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
};

// Icônes selon le niveau de risque
const riskIcons: Record<string, React.ReactNode> = {
  critique: <AlertTriangle className="w-5 h-5 text-red-600" />,
  majeur: <AlertCircle className="w-5 h-5 text-orange-600" />,
  'modéré': <Info className="w-5 h-5 text-yellow-600" />,
  mineur: <Info className="w-5 h-5 text-blue-600" />,
  acceptable: <CheckCircle className="w-5 h-5 text-green-600" />,
};

export const FMEAAnalysis: React.FC<FMEAAnalysisProps> = ({
  requirements,
  systemContext = "système industriel",
  industry = "general",
  onExport,
}) => {
  const [fmeaData, setFmeaData] = useState<FMEAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterRisk, setFilterRisk] = useState<string>('all');
  
  // États pour la sauvegarde
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Hook pour les analyses sauvegardées
  const {
    fmeaAnalyses,
    saveFMEAAnalysis,
    loadFMEAAnalysis,
    deleteFMEAAnalysis,
    loading: historyLoading,
  } = useSavedAnalyses();

  const generateFMEA = async () => {
    if (!requirements || requirements.length === 0) {
      setError("Aucune exigence disponible pour l'analyse FMEA");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/fmea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements,
          system_context: systemContext,
          industry,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setFmeaData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération FMEA");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredItems = fmeaData?.fmea_items.filter(item => 
    filterRisk === 'all' || item.risk_level === filterRisk
  ) || [];

  const handleExport = (format: string) => {
    if (fmeaData && onExport) {
      onExport(format, fmeaData);
    }
  };

  // Sauvegarder l'analyse FMEA
  const handleSave = async () => {
    if (!fmeaData || !saveName.trim()) {
      alert('Veuillez entrer un nom pour l\'analyse');
      return;
    }
    
    console.log('Starting FMEA save...', { name: saveName, itemsCount: fmeaData.fmea_items.length });
    setSaving(true);
    
    try {
      const savedId = await saveFMEAAnalysis(saveName, fmeaData, undefined, saveDescription);
      console.log('Save result:', savedId);
      
      if (savedId) {
        alert('✅ Analyse FMEA sauvegardée avec succès !');
        setShowSaveDialog(false);
        setSaveName('');
        setSaveDescription('');
      } else {
        alert('❌ Erreur lors de la sauvegarde. Vérifiez la console.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  // Charger une analyse sauvegardée
  const handleLoadSaved = async (analysisId: string) => {
    const saved = await loadFMEAAnalysis(analysisId);
    if (saved) {
      // Convertir les données sauvegardées au format FMEAData
      const loadedData: FMEAData = {
        fmea_items: saved.items.map((item) => ({
          id: item.id,
          requirement_id: item.requirement_id,
          requirement_title: item.requirement_title,
          function: '',
          failure_mode: item.failure_mode,
          failure_effect: item.failure_effect,
          failure_cause: item.failure_cause,
          severity: item.severity,
          severity_desc: '',
          occurrence: item.occurrence,
          occurrence_desc: '',
          detection: item.detection,
          detection_desc: '',
          rpn: item.rpn,
          risk_level: item.risk_level,
          current_controls: item.current_controls || '',
          recommended_actions: item.recommended_action?.split('; ') || [],
          action_owner: '',
          target_date: '',
          status: 'loaded',
        })),
        statistics: {
          total_items: saved.analysis.total_items,
          by_risk_level: {
            critique: saved.analysis.critical_count,
            majeur: saved.analysis.major_count,
            'modéré': saved.analysis.moderate_count,
            mineur: saved.analysis.minor_count,
          },
          average_rpn: saved.analysis.average_rpn,
          max_rpn: saved.analysis.max_rpn,
          min_rpn: 0,
          critical_items: [],
          top_5_rpn: [],
          action_required_count: saved.analysis.critical_count + saved.analysis.major_count,
        },
        metadata: {
          system_context: (saved.analysis.metadata as any)?.system_context || 'système industriel',
          industry: (saved.analysis.metadata as any)?.industry || 'general',
          total_requirements: saved.analysis.total_items,
          total_failure_modes: saved.analysis.total_items,
        },
      };
      setFmeaData(loadedData);
      setShowHistory(false);
    }
  };

  // Supprimer une analyse sauvegardée
  const handleDeleteSaved = async (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer cette analyse FMEA sauvegardée ?')) {
      await deleteFMEAAnalysis(analysisId);
    }
  };

  // Rendu du score avec couleur
  const ScoreBadge: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = (value / max) * 100;
    let colorClass = 'bg-green-500';
    if (percentage >= 70) colorClass = 'bg-red-500';
    else if (percentage >= 50) colorClass = 'bg-orange-500';
    else if (percentage >= 30) colorClass = 'bg-yellow-500';

    return (
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold">{value}</span>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // RPN Badge avec couleur
  const RPNBadge: React.FC<{ rpn: number; riskLevel: string }> = ({ rpn, riskLevel }) => {
    const colors = riskColors[riskLevel] || riskColors.acceptable;
    return (
      <div className={`px-3 py-1 rounded-full ${colors.bg} ${colors.text} font-bold text-sm`}>
        RPN: {rpn}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sauvegarder l'analyse FMEA</h3>
              <button onClick={() => setShowSaveDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'analyse *</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex: FMEA Système de freinage v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Notes ou commentaires..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim() || saving}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Historique des analyses FMEA
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {historyLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Chargement...
                </div>
              ) : fmeaAnalyses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Aucune analyse sauvegardée
                </div>
              ) : (
                fmeaAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    onClick={() => handleLoadSaved(analysis.id)}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{analysis.name}</h4>
                        {analysis.description && (
                          <p className="text-sm text-gray-500 mt-1">{analysis.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(analysis.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <span className="text-red-500">{analysis.critical_count} critiques</span>
                          <span className="text-orange-500">{analysis.major_count} majeurs</span>
                          <span>RPN max: {analysis.max_rpn}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSaved(analysis.id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Analyse FMEA
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Failure Mode and Effects Analysis • {requirements.length} exigences
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton Historique */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            title="Voir l'historique"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Historique</span>
            {fmeaAnalyses.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-300 rounded-full">{fmeaAnalyses.length}</span>
            )}
          </button>

          {fmeaData && (
            <>
              {/* Bouton Sauvegarder */}
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Tous les risques</option>
                <option value="critique">🔴 Critique</option>
                <option value="majeur">🟠 Majeur</option>
                <option value="modéré">🟡 Modéré</option>
                <option value="mineur">🔵 Mineur</option>
                <option value="acceptable">🟢 Acceptable</option>
              </select>
              
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </>
          )}
          
          <button
            onClick={generateFMEA}
            disabled={loading || requirements.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {loading ? 'Analyse en cours...' : fmeaData ? 'Régénérer' : 'Générer FMEA'}
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Statistiques */}
      {fmeaData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">
              {fmeaData.statistics.total_items}
            </div>
            <div className="text-sm text-gray-500">Modes de défaillance</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-amber-600">
              {fmeaData.statistics.average_rpn}
            </div>
            <div className="text-sm text-gray-500">RPN moyen</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {fmeaData.statistics.max_rpn}
            </div>
            <div className="text-sm text-gray-500">RPN max</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {fmeaData.statistics.by_risk_level?.critique || 0}
            </div>
            <div className="text-sm text-gray-500">Risques critiques</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {fmeaData.statistics.action_required_count}
            </div>
            <div className="text-sm text-gray-500">Actions requises</div>
          </div>
        </div>
      )}

      {/* Top 5 RPN */}
      {fmeaData && fmeaData.statistics.top_5_rpn && fmeaData.statistics.top_5_rpn.length > 0 && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-800 mb-2">⚠️ Top 5 RPN les plus élevés</h3>
          <div className="space-y-2">
            {fmeaData.statistics.top_5_rpn.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="flex-1 text-gray-700">{item.failure_mode}</span>
                <span className="font-mono font-bold text-red-600">RPN: {item.rpn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des items FMEA */}
      {fmeaData && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">
            Détail des modes de défaillance ({filteredItems.length})
          </h3>
          
          {filteredItems.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const colors = riskColors[item.risk_level] || riskColors.acceptable;
            
            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg border-l-4 ${colors.border} shadow-sm overflow-hidden`}
              >
                {/* Header cliquable */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {riskIcons[item.risk_level]}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-400">{item.id}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-blue-600">{item.requirement_id}</span>
                      </div>
                      <div className="font-medium text-gray-900">{item.failure_mode}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500 hidden md:flex gap-4">
                      <span>S:{item.severity}</span>
                      <span>O:{item.occurrence}</span>
                      <span>D:{item.detection}</span>
                    </div>
                    <RPNBadge rpn={item.rpn} riskLevel={item.risk_level} />
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Détails expandables */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Colonne gauche */}
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase">Exigence</div>
                          <div className="text-sm text-gray-700">{item.requirement_title}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase">Fonction</div>
                          <div className="text-sm text-gray-700">{item.function}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase">Effet</div>
                          <div className="text-sm text-gray-700">{item.failure_effect}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase">Cause</div>
                          <div className="text-sm text-gray-700">{item.failure_cause}</div>
                        </div>
                      </div>
                      
                      {/* Colonne droite */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-gray-500">Gravité (S)</div>
                            <ScoreBadge value={item.severity} max={10} />
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-gray-500">Occurrence (O)</div>
                            <ScoreBadge value={item.occurrence} max={10} />
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-gray-500">Détection (D)</div>
                            <ScoreBadge value={item.detection} max={10} />
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase">Contrôles actuels</div>
                          <div className="text-sm text-gray-700">{item.current_controls}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase">Actions recommandées</div>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {item.recommended_actions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* État initial */}
      {!fmeaData && !loading && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Analyse FMEA non générée</h3>
          <p className="text-gray-500 mb-4">
            Cliquez sur "Générer FMEA" pour analyser les modes de défaillance de vos exigences
          </p>
          <p className="text-sm text-gray-400">
            L'analyse FMEA identifie les risques potentiels et calcule le RPN (Risk Priority Number)
          </p>
        </div>
      )}
    </div>
  );
};

export default FMEAAnalysis;
