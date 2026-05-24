/**
 * ComplianceCheck - Composant de vérification de conformité normative
 * Vérifie les exigences par rapport aux normes industrielles (ISO 26262, IEC 61508, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, Download, RefreshCw, FileText, Target, AlertTriangle, Save, History, Trash2, Clock, X } from 'lucide-react';
import { useSavedAnalyses, SavedComplianceAnalysis } from '@/hooks/useSavedAnalyses';

interface Norm {
  id: string;
  name: string;
  full_name: string;
  domain: string;
  description: string;
  categories_count: number;
  criteria_count: number;
}

interface CriterionResult {
  criterion_id: string;
  criterion_text: string;
  status: 'couvert' | 'partiel' | 'non_couvert';
  matching_requirements: Array<{
    requirement_id: string;
    requirement_title: string;
    match_score: number;
    confidence: number;
  }>;
  coverage_count: number;
  recommendation: string;
}

interface CategoryResult {
  category_id: string;
  category_name: string;
  criteria_results: CriterionResult[];
  coverage_score: number;
  total_criteria: number;
  covered_count: number;
  partial_count: number;
}

interface ComplianceData {
  norm_id: string;
  norm_name: string;
  norm_full_name: string;
  domain: string;
  compliance_level: string;
  global_score: number;
  statistics: {
    total_requirements: number;
    total_criteria: number;
    covered_criteria: number;
    partially_covered: number;
    uncovered_criteria: number;
  };
  categories: CategoryResult[];
  priority_recommendations: Array<{
    priority: number;
    action: string;
    criterion?: string;
    impact: string;
    effort?: string;
  }>;
  gaps: Array<{
    category: string;
    criterion_id: string;
    criterion_text: string;
    severity: string;
  }>;
  strengths: Array<{
    category: string;
    score: number;
    covered_count: number;
  }>;
}

interface ComplianceCheckProps {
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
  onExport?: (format: string, data: ComplianceData) => void;
}

// Couleurs selon le niveau de conformité
const complianceLevelColors: Record<string, { bg: string; text: string; border: string }> = {
  conforme: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  quasi_conforme: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  partiellement_conforme: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  non_conforme: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  non_applicable: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' },
};

const complianceLevelLabels: Record<string, string> = {
  conforme: '✅ Conforme',
  quasi_conforme: '🔵 Quasi-conforme',
  partiellement_conforme: '🟡 Partiellement conforme',
  non_conforme: '🟠 Non conforme',
  non_applicable: '⚪ Non applicable',
};

const statusIcons: Record<string, React.ReactNode> = {
  couvert: <CheckCircle className="w-4 h-4 text-green-500" />,
  partiel: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  non_couvert: <XCircle className="w-4 h-4 text-red-500" />,
};

const statusColors: Record<string, string> = {
  couvert: 'bg-green-100 text-green-800 border-green-300',
  partiel: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  non_couvert: 'bg-red-100 text-red-800 border-red-300',
};

export const ComplianceCheck: React.FC<ComplianceCheckProps> = ({
  requirements,
  onExport,
}) => {
  const [availableNorms, setAvailableNorms] = useState<Norm[]>([]);
  const [selectedNorm, setSelectedNorm] = useState<string>('');
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingNorms, setLoadingNorms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showGapsOnly, setShowGapsOnly] = useState(false);
  
  // États pour la sauvegarde
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Hook pour les analyses sauvegardées
  const {
    complianceAnalyses,
    saveComplianceAnalysis,
    loadComplianceAnalysis,
    deleteComplianceAnalysis,
    loading: historyLoading,
  } = useSavedAnalyses();

  // Charger les normes disponibles au montage
  useEffect(() => {
    const fetchNorms = async () => {
      try {
        const response = await fetch('http://localhost:8000/compliance/norms');
        if (response.ok) {
          const data = await response.json();
          setAvailableNorms(data.norms);
          if (data.norms.length > 0) {
            setSelectedNorm(data.norms[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load norms:', err);
      } finally {
        setLoadingNorms(false);
      }
    };
    fetchNorms();
  }, []);

  const checkCompliance = async () => {
    if (!selectedNorm || requirements.length === 0) {
      setError("Sélectionnez une norme et assurez-vous d'avoir des exigences");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements,
          norm_id: selectedNorm,
          use_llm: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setComplianceData(data);
      
      // Expand categories with issues by default
      const categoriesWithIssues = new Set<string>(
        data.categories
          .filter((cat: CategoryResult) => cat.coverage_score < 100)
          .map((cat: CategoryResult) => cat.category_id)
      );
      setExpandedCategories(categoriesWithIssues);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleExport = (format: string) => {
    if (complianceData && onExport) {
      onExport(format, complianceData);
    }
  };

  // Sauvegarder l'analyse de conformité
  const handleSave = async () => {
    if (!complianceData || !saveName.trim()) {
      alert('Veuillez entrer un nom pour l\'analyse');
      return;
    }
    
    console.log('Starting Compliance save...', { name: saveName, norm: complianceData.norm_name });
    setSaving(true);
    
    try {
      const savedId = await saveComplianceAnalysis(saveName, complianceData);
      console.log('Save result:', savedId);
      
      if (savedId) {
        alert('✅ Analyse de conformité sauvegardée avec succès !');
        setShowSaveDialog(false);
        setSaveName('');
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
    const saved = await loadComplianceAnalysis(analysisId);
    if (saved) {
      // Grouper les résultats par catégorie
      const categoriesMap = new Map<string, CategoryResult>();
      
      for (const result of saved.results) {
        if (!categoriesMap.has(result.category)) {
          categoriesMap.set(result.category, {
            category_id: result.category.toLowerCase().replace(/\s+/g, '_'),
            category_name: result.category,
            criteria_results: [],
            coverage_score: 0,
            total_criteria: 0,
            covered_count: 0,
            partial_count: 0,
          });
        }
        
        const cat = categoriesMap.get(result.category)!;
        cat.criteria_results.push({
          criterion_id: result.criterion_id,
          criterion_text: result.criterion_description,
          status: result.status === 'compliant' ? 'couvert' 
            : result.status === 'partial' ? 'partiel' 
            : 'non_couvert',
          matching_requirements: result.matching_requirements as any,
          coverage_count: result.matching_requirements.length,
          recommendation: result.recommendations.join('; '),
        });
        cat.total_criteria++;
        if (result.status === 'compliant') cat.covered_count++;
        if (result.status === 'partial') cat.partial_count++;
      }

      // Calculer les scores par catégorie
      for (const cat of categoriesMap.values()) {
        cat.coverage_score = cat.total_criteria > 0 
          ? Math.round(((cat.covered_count + cat.partial_count * 0.5) / cat.total_criteria) * 100)
          : 0;
      }

      const loadedData: ComplianceData = {
        norm_id: saved.analysis.norm_id,
        norm_name: saved.analysis.norm_name,
        norm_full_name: saved.analysis.norm_name,
        domain: '',
        compliance_level: saved.analysis.overall_score >= 90 ? 'conforme' 
          : saved.analysis.overall_score >= 70 ? 'quasi_conforme'
          : saved.analysis.overall_score >= 50 ? 'partiellement_conforme'
          : 'non_conforme',
        global_score: saved.analysis.overall_score,
        statistics: {
          total_requirements: 0,
          total_criteria: saved.analysis.compliant_count + saved.analysis.partial_count + saved.analysis.non_compliant_count,
          covered_criteria: saved.analysis.compliant_count,
          partially_covered: saved.analysis.partial_count,
          uncovered_criteria: saved.analysis.non_compliant_count,
        },
        categories: Array.from(categoriesMap.values()),
        priority_recommendations: (saved.analysis.metadata?.recommendations as any[]) || [],
        gaps: (saved.analysis.metadata?.gaps as any[]) || [],
        strengths: [],
      };
      
      setComplianceData(loadedData);
      setSelectedNorm(saved.analysis.norm_id);
      setShowHistory(false);
    }
  };

  // Supprimer une analyse sauvegardée
  const handleDeleteSaved = async (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer cette analyse de conformité sauvegardée ?')) {
      await deleteComplianceAnalysis(analysisId);
    }
  };

  // Score gauge component
  const ScoreGauge: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'lg' }) => {
    const radius = size === 'lg' ? 60 : 30;
    const stroke = size === 'lg' ? 10 : 5;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    
    let color = '#ef4444'; // red
    if (score >= 90) color = '#22c55e'; // green
    else if (score >= 70) color = '#3b82f6'; // blue
    else if (score >= 50) color = '#eab308'; // yellow
    else if (score >= 25) color = '#f97316'; // orange

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg 
          width={(radius + stroke) * 2} 
          height={(radius + stroke) * 2}
          className="transform -rotate-90"
        >
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
            {score}%
          </span>
        </div>
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
              <h3 className="text-lg font-semibold text-gray-900">Sauvegarder l'analyse de conformité</h3>
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
                  placeholder="Ex: Conformité ISO 26262 - Projet X"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Norme :</strong> {complianceData?.norm_name}<br/>
                  <strong>Score :</strong> {complianceData?.global_score}%
                </p>
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                Historique des analyses de conformité
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
              ) : complianceAnalyses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Aucune analyse sauvegardée
                </div>
              ) : (
                complianceAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    onClick={() => handleLoadSaved(analysis.id)}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{analysis.name}</h4>
                        <p className="text-sm text-blue-600 mt-1">{analysis.norm_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(analysis.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <span className={`font-semibold ${
                            analysis.overall_score >= 80 ? 'text-green-500' :
                            analysis.overall_score >= 50 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            Score: {analysis.overall_score}%
                          </span>
                          <span className="text-green-500">{analysis.compliant_count} conformes</span>
                          <span className="text-red-500">{analysis.non_compliant_count} écarts</span>
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
            <Shield className="w-6 h-6 text-blue-600" />
            Vérification de Conformité
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Vérifiez vos exigences par rapport aux normes industrielles
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bouton Historique */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            title="Voir l'historique"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Historique</span>
            {complianceAnalyses.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-300 rounded-full">{complianceAnalyses.length}</span>
            )}
          </button>

          {complianceData && (
            <>
              {/* Bouton Sauvegarder */}
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </>
          )}

          {/* Sélection de la norme */}
          <select
            value={selectedNorm}
            onChange={(e) => setSelectedNorm(e.target.value)}
            disabled={loadingNorms}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            {loadingNorms ? (
              <option>Chargement...</option>
            ) : (
              availableNorms.map((norm) => (
                <option key={norm.id} value={norm.id}>
                  {norm.name} - {norm.domain}
                </option>
              ))
            )}
          </select>
          
          {complianceData && (
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          
          <button
            onClick={checkCompliance}
            disabled={loading || requirements.length === 0 || !selectedNorm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {loading ? 'Analyse...' : complianceData ? 'Revérifier' : 'Vérifier la conformité'}
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Info norme sélectionnée */}
      {selectedNorm && !complianceData && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          {availableNorms.find(n => n.id === selectedNorm) && (
            <div>
              <h3 className="font-semibold text-blue-800">
                {availableNorms.find(n => n.id === selectedNorm)?.full_name}
              </h3>
              <p className="text-sm text-blue-600 mt-1">
                {availableNorms.find(n => n.id === selectedNorm)?.description}
              </p>
              <div className="flex gap-4 mt-2 text-sm text-blue-700">
                <span>📁 {availableNorms.find(n => n.id === selectedNorm)?.categories_count} catégories</span>
                <span>📋 {availableNorms.find(n => n.id === selectedNorm)?.criteria_count} critères</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Résultats */}
      {complianceData && (
        <>
          {/* Score global */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-6">
                <ScoreGauge score={complianceData.global_score} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {complianceData.norm_name}
                  </h3>
                  <p className="text-sm text-gray-500">{complianceData.norm_full_name}</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full mt-2 ${
                    complianceLevelColors[complianceData.compliance_level]?.bg || 'bg-gray-100'
                  } ${complianceLevelColors[complianceData.compliance_level]?.text || 'text-gray-800'}`}>
                    {complianceLevelLabels[complianceData.compliance_level] || complianceData.compliance_level}
                  </div>
                </div>
              </div>
              
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {complianceData.statistics.total_criteria}
                  </div>
                  <div className="text-xs text-gray-500">Critères total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {complianceData.statistics.covered_criteria}
                  </div>
                  <div className="text-xs text-gray-500">Couverts</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {complianceData.statistics.partially_covered}
                  </div>
                  <div className="text-xs text-gray-500">Partiels</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {complianceData.statistics.uncovered_criteria}
                  </div>
                  <div className="text-xs text-gray-500">Non couverts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommandations prioritaires */}
          {complianceData.priority_recommendations && complianceData.priority_recommendations.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Actions prioritaires
              </h3>
              <div className="space-y-2">
                {complianceData.priority_recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-100">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      rec.impact === 'high' ? 'bg-red-500 text-white' :
                      rec.impact === 'medium' ? 'bg-yellow-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {rec.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{rec.action}</p>
                      {rec.effort && (
                        <p className="text-xs text-gray-500 mt-1">Effort estimé: {rec.effort}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtre */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showGapsOnly}
                onChange={(e) => setShowGapsOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Afficher uniquement les écarts
            </label>
          </div>

          {/* Catégories */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Détail par catégorie</h3>
            
            {complianceData.categories.map((category) => {
              const isExpanded = expandedCategories.has(category.category_id);
              const hasIssues = category.coverage_score < 100;
              
              // Filtrer si showGapsOnly
              const visibleCriteria = showGapsOnly 
                ? category.criteria_results.filter(c => c.status !== 'couvert')
                : category.criteria_results;
              
              if (showGapsOnly && visibleCriteria.length === 0) return null;
              
              return (
                <div
                  key={category.category_id}
                  className={`bg-white rounded-lg border shadow-sm overflow-hidden ${
                    hasIssues ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'
                  }`}
                >
                  {/* Header catégorie */}
                  <div
                    onClick={() => toggleCategory(category.category_id)}
                    className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <ScoreGauge score={category.coverage_score} size="sm" />
                      <div>
                        <h4 className="font-medium text-gray-900">{category.category_name}</h4>
                        <p className="text-sm text-gray-500">
                          {category.covered_count}/{category.total_criteria} couverts
                          {category.partial_count > 0 && `, ${category.partial_count} partiels`}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Critères */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {visibleCriteria.map((criterion) => (
                        <div key={criterion.criterion_id} className="p-4 bg-gray-50">
                          <div className="flex items-start gap-3">
                            {statusIcons[criterion.status]}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-gray-400">
                                  {criterion.criterion_id}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[criterion.status]}`}>
                                  {criterion.status === 'couvert' ? 'Couvert' : 
                                   criterion.status === 'partiel' ? 'Partiel' : 'Non couvert'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 mt-1">{criterion.criterion_text}</p>
                              
                              {/* Exigences correspondantes */}
                              {criterion.matching_requirements.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1">Exigences correspondantes:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {criterion.matching_requirements.map((req, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                                        title={req.requirement_title}
                                      >
                                        {req.requirement_id} ({req.confidence}%)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Recommandation */}
                              <p className="text-xs mt-2 text-gray-600">
                                {criterion.recommendation}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Points forts */}
          {complianceData.strengths && complianceData.strengths.length > 0 && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Points forts
              </h3>
              <div className="flex flex-wrap gap-2">
                {complianceData.strengths.map((strength, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {strength.category} ({strength.score}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* État initial */}
      {!complianceData && !loading && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Vérification non effectuée</h3>
          <p className="text-gray-500 mb-4">
            Sélectionnez une norme et cliquez sur "Vérifier la conformité" pour analyser vos exigences
          </p>
          <p className="text-sm text-gray-400">
            {requirements.length} exigences disponibles pour l'analyse
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplianceCheck;
