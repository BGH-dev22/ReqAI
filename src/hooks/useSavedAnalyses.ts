/**
 * Hook pour gérer les analyses FMEA et Conformité sauvegardées
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Types pour FMEA
export interface SavedFMEAAnalysis {
  id: string;
  user_id: string;
  document_id?: string;
  name: string;
  description?: string;
  total_items: number;
  critical_count: number;
  major_count: number;
  moderate_count: number;
  minor_count: number;
  average_rpn: number;
  max_rpn: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FMEAItem {
  id: string;
  fmea_analysis_id: string;
  requirement_id: string;
  requirement_title: string;
  failure_mode: string;
  failure_effect: string;
  failure_cause: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  risk_level: string;
  recommended_action?: string;
  current_controls?: string;
  created_at: string;
}

// Types pour Compliance
export interface SavedComplianceAnalysis {
  id: string;
  user_id: string;
  document_id?: string;
  name: string;
  norm_id: string;
  norm_name: string;
  overall_score: number;
  compliant_count: number;
  partial_count: number;
  non_compliant_count: number;
  not_applicable_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceResult {
  id: string;
  compliance_analysis_id: string;
  category: string;
  criterion_id: string;
  criterion_description: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  confidence: number;
  matching_requirements: Array<{ requirement_id: string; requirement_title: string }>;
  gaps: string[];
  recommendations: string[];
  created_at: string;
}

export function useSavedAnalyses() {
  const { user } = useAuth();
  const [fmeaAnalyses, setFmeaAnalyses] = useState<SavedFMEAAnalysis[]>([]);
  const [complianceAnalyses, setComplianceAnalyses] = useState<SavedComplianceAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les analyses FMEA sauvegardées
  const loadFMEAAnalyses = useCallback(async () => {
    try {
      let query = supabase
        .from('fmea_analyses')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filtrer par user si connecté
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFmeaAnalyses(data || []);
    } catch (err) {
      console.error('Error loading FMEA analyses:', err);
    }
  }, [user]);

  // Charger les analyses de conformité sauvegardées
  const loadComplianceAnalyses = useCallback(async () => {
    try {
      let query = supabase
        .from('compliance_analyses')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filtrer par user si connecté
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComplianceAnalyses(data || []);
    } catch (err) {
      console.error('Error loading compliance analyses:', err);
    }
  }, [user]);

  // Sauvegarder une analyse FMEA
  const saveFMEAAnalysis = async (
    name: string,
    fmeaData: {
      fmea_items: Array<{
        id: string;
        requirement_id: string;
        requirement_title: string;
        failure_mode: string;
        failure_effect: string;
        failure_cause: string;
        severity: number;
        occurrence: number;
        detection: number;
        rpn: number;
        risk_level: string;
        recommended_actions?: string[];
        current_controls?: string;
      }>;
      statistics: {
        total_items: number;
        by_risk_level?: Record<string, number>;
        average_rpn: number;
        max_rpn: number;
      };
      metadata?: Record<string, any>;
    },
    documentId?: string,
    description?: string
  ): Promise<string | null> => {
    console.log('saveFMEAAnalysis called', { name, userId: user?.id });

    setLoading(true);
    setError(null);

    try {
      console.log('Inserting FMEA analysis...');
      
      // Utiliser user.id si disponible, sinon null (mode dev)
      const userId = user?.id || null;
      
      // Créer l'analyse principale
      const { data: analysisData, error: analysisError } = await supabase
        .from('fmea_analyses')
        .insert({
          user_id: userId,
          document_id: documentId || null,
          name,
          description,
          total_items: fmeaData.statistics.total_items,
          critical_count: fmeaData.statistics.by_risk_level?.critique || 0,
          major_count: fmeaData.statistics.by_risk_level?.majeur || 0,
          moderate_count: fmeaData.statistics.by_risk_level?.['modéré'] || 0,
          minor_count: fmeaData.statistics.by_risk_level?.mineur || 0,
          average_rpn: fmeaData.statistics.average_rpn,
          max_rpn: fmeaData.statistics.max_rpn,
          metadata: fmeaData.metadata || {},
        })
        .select()
        .single();

      if (analysisError) {
        console.error('Error inserting FMEA analysis:', analysisError);
        throw analysisError;
      }
      
      console.log('FMEA analysis created:', analysisData?.id);

      // Fonction pour normaliser le risk_level vers les valeurs acceptées par la DB
      const normalizeRiskLevel = (level: string): string => {
        const normalized = level?.toLowerCase().trim() || 'acceptable';
        // Mapper les variantes possibles
        const mapping: Record<string, string> = {
          'critique': 'critique',
          'critical': 'critique',
          'majeur': 'majeur',
          'major': 'majeur',
          'modéré': 'modéré',
          'modere': 'modéré',
          'moderate': 'modéré',
          'moyen': 'modéré',
          'mineur': 'mineur',
          'minor': 'mineur',
          'acceptable': 'acceptable',
          'low': 'acceptable',
          'faible': 'acceptable',
        };
        return mapping[normalized] || 'acceptable';
      };

      // Insérer les éléments FMEA
      if (fmeaData.fmea_items.length > 0) {
        const items = fmeaData.fmea_items.map(item => ({
          fmea_analysis_id: analysisData.id,
          requirement_id: item.requirement_id,
          requirement_title: item.requirement_title,
          failure_mode: item.failure_mode,
          failure_effect: item.failure_effect,
          failure_cause: item.failure_cause,
          severity: item.severity,
          occurrence: item.occurrence,
          detection: item.detection,
          rpn: item.rpn,
          risk_level: normalizeRiskLevel(item.risk_level),
          recommended_action: item.recommended_actions?.join('; ') || null,
          current_controls: item.current_controls || null,
        }));

        // Log les risk_levels pour debug
        console.log('FMEA items risk_levels:', items.map(i => i.risk_level));

        const { error: itemsError } = await supabase
          .from('fmea_items')
          .insert(items);

        if (itemsError) {
          console.error('Error inserting FMEA items:', itemsError);
          console.error('Items that failed:', items.slice(0, 3)); // Log first 3 items
          throw itemsError;
        }
        console.log('FMEA items inserted:', items.length);
      }

      await loadFMEAAnalyses();
      console.log('FMEA save complete, returning ID:', analysisData.id);
      return analysisData.id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      console.error('FMEA save failed:', errorMsg, err);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Charger une analyse FMEA avec ses items
  const loadFMEAAnalysis = async (analysisId: string): Promise<{
    analysis: SavedFMEAAnalysis;
    items: FMEAItem[];
  } | null> => {
    try {
      const [analysisResult, itemsResult] = await Promise.all([
        supabase
          .from('fmea_analyses')
          .select('*')
          .eq('id', analysisId)
          .single(),
        supabase
          .from('fmea_items')
          .select('*')
          .eq('fmea_analysis_id', analysisId)
          .order('rpn', { ascending: false })
      ]);

      if (analysisResult.error) throw analysisResult.error;
      if (itemsResult.error) throw itemsResult.error;

      return {
        analysis: analysisResult.data,
        items: itemsResult.data || []
      };
    } catch (err) {
      console.error('Error loading FMEA analysis:', err);
      return null;
    }
  };

  // Sauvegarder une analyse de conformité
  const saveComplianceAnalysis = async (
    name: string,
    complianceData: {
      norm_id: string;
      norm_name: string;
      global_score: number;
      statistics: {
        covered_criteria: number;
        partially_covered: number;
        uncovered_criteria: number;
      };
      categories: Array<{
        category_id: string;
        category_name: string;
        criteria_results: Array<{
          criterion_id: string;
          criterion_text: string;
          status: string;
          matching_requirements: Array<{ requirement_id: string; requirement_title: string }>;
          recommendation?: string;
        }>;
      }>;
      gaps?: Array<{ criterion_text: string; severity: string }>;
      priority_recommendations?: Array<{ action: string }>;
    },
    documentId?: string
  ): Promise<string | null> => {
    console.log('saveComplianceAnalysis called', { name, userId: user?.id });

    setLoading(true);
    setError(null);

    try {
      // Utiliser user.id si disponible, sinon null (mode dev)
      const userId = user?.id || null;
      
      // Créer l'analyse principale
      const { data: analysisData, error: analysisError } = await supabase
        .from('compliance_analyses')
        .insert({
          user_id: userId,
          document_id: documentId || null,
          name,
          norm_id: complianceData.norm_id,
          norm_name: complianceData.norm_name,
          overall_score: complianceData.global_score,
          compliant_count: complianceData.statistics.covered_criteria,
          partial_count: complianceData.statistics.partially_covered,
          non_compliant_count: complianceData.statistics.uncovered_criteria,
          not_applicable_count: 0,
          metadata: {
            gaps: complianceData.gaps,
            recommendations: complianceData.priority_recommendations,
          },
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Insérer les résultats par critère
      const results: Array<Record<string, any>> = [];
      for (const category of complianceData.categories) {
        for (const criterion of category.criteria_results) {
          results.push({
            compliance_analysis_id: analysisData.id,
            category: category.category_name,
            criterion_id: criterion.criterion_id,
            criterion_description: criterion.criterion_text,
            status: criterion.status === 'couvert' ? 'compliant' 
              : criterion.status === 'partiel' ? 'partial' 
              : criterion.status === 'non_couvert' ? 'non_compliant' 
              : 'not_applicable',
            confidence: 0.8,
            matching_requirements: criterion.matching_requirements || [],
            gaps: [],
            recommendations: criterion.recommendation ? [criterion.recommendation] : [],
          });
        }
      }

      if (results.length > 0) {
        const { error: resultsError } = await supabase
          .from('compliance_results')
          .insert(results);

        if (resultsError) throw resultsError;
      }

      await loadComplianceAnalyses();
      return analysisData.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Charger une analyse de conformité avec ses résultats
  const loadComplianceAnalysis = async (analysisId: string): Promise<{
    analysis: SavedComplianceAnalysis;
    results: ComplianceResult[];
  } | null> => {
    try {
      const [analysisResult, resultsResult] = await Promise.all([
        supabase
          .from('compliance_analyses')
          .select('*')
          .eq('id', analysisId)
          .single(),
        supabase
          .from('compliance_results')
          .select('*')
          .eq('compliance_analysis_id', analysisId)
      ]);

      if (analysisResult.error) throw analysisResult.error;
      if (resultsResult.error) throw resultsResult.error;

      return {
        analysis: analysisResult.data,
        results: resultsResult.data || []
      };
    } catch (err) {
      console.error('Error loading compliance analysis:', err);
      return null;
    }
  };

  // Supprimer une analyse FMEA
  const deleteFMEAAnalysis = async (analysisId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('fmea_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
      await loadFMEAAnalyses();
      return true;
    } catch (err) {
      console.error('Error deleting FMEA analysis:', err);
      return false;
    }
  };

  // Supprimer une analyse de conformité
  const deleteComplianceAnalysis = async (analysisId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('compliance_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
      await loadComplianceAnalyses();
      return true;
    } catch (err) {
      console.error('Error deleting compliance analysis:', err);
      return false;
    }
  };

  // Charger les analyses au montage
  useEffect(() => {
    loadFMEAAnalyses();
    loadComplianceAnalyses();
  }, [loadFMEAAnalyses, loadComplianceAnalyses]);

  return {
    // État
    fmeaAnalyses,
    complianceAnalyses,
    loading,
    error,

    // Actions FMEA
    saveFMEAAnalysis,
    loadFMEAAnalysis,
    deleteFMEAAnalysis,
    refreshFMEA: loadFMEAAnalyses,

    // Actions Compliance
    saveComplianceAnalysis,
    loadComplianceAnalysis,
    deleteComplianceAnalysis,
    refreshCompliance: loadComplianceAnalyses,
  };
}
