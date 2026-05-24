-- Migration pour les analyses FMEA et Conformité
-- Créé le: 2025-01-13

BEGIN;

-- ==========================================
-- TABLE: fmea_analyses
-- ==========================================
CREATE TABLE IF NOT EXISTS fmea_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID DEFAULT NULL,
    name TEXT NOT NULL,
    description TEXT,
    total_items INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    major_count INTEGER DEFAULT 0,
    moderate_count INTEGER DEFAULT 0,
    minor_count INTEGER DEFAULT 0,
    average_rpn FLOAT DEFAULT 0,
    max_rpn INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: fmea_items (les éléments individuels d'une analyse FMEA)
-- ==========================================
CREATE TABLE IF NOT EXISTS fmea_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fmea_analysis_id UUID REFERENCES fmea_analyses(id) ON DELETE CASCADE,
    requirement_id TEXT,
    requirement_title TEXT,
    failure_mode TEXT NOT NULL,
    failure_effect TEXT NOT NULL,
    failure_cause TEXT NOT NULL,
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
    occurrence INTEGER NOT NULL CHECK (occurrence >= 1 AND occurrence <= 10),
    detection INTEGER NOT NULL CHECK (detection >= 1 AND detection <= 10),
    rpn INTEGER NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('critique', 'majeur', 'modéré', 'mineur', 'acceptable')),
    recommended_action TEXT,
    current_controls TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: compliance_analyses
-- ==========================================
CREATE TABLE IF NOT EXISTS compliance_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID DEFAULT NULL,
    name TEXT NOT NULL,
    norm_id TEXT NOT NULL,
    norm_name TEXT NOT NULL,
    overall_score FLOAT DEFAULT 0,
    compliant_count INTEGER DEFAULT 0,
    partial_count INTEGER DEFAULT 0,
    non_compliant_count INTEGER DEFAULT 0,
    not_applicable_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: compliance_results (résultats par catégorie/critère)
-- ==========================================
CREATE TABLE IF NOT EXISTS compliance_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compliance_analysis_id UUID REFERENCES compliance_analyses(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    criterion_id TEXT NOT NULL,
    criterion_description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('compliant', 'partial', 'non_compliant', 'not_applicable')),
    confidence FLOAT DEFAULT 0,
    matching_requirements JSONB DEFAULT '[]'::jsonb,
    gaps JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEX pour les performances
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_fmea_analyses_user_id ON fmea_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_fmea_analyses_document_id ON fmea_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_fmea_items_analysis_id ON fmea_items(fmea_analysis_id);
CREATE INDEX IF NOT EXISTS idx_compliance_analyses_user_id ON compliance_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_analyses_document_id ON compliance_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_compliance_results_analysis_id ON compliance_results(compliance_analysis_id);

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================
ALTER TABLE fmea_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fmea_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_results ENABLE ROW LEVEL SECURITY;

-- Policies pour fmea_analyses
CREATE POLICY "Users can view their own FMEA analyses"
    ON fmea_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FMEA analyses"
    ON fmea_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FMEA analyses"
    ON fmea_analyses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FMEA analyses"
    ON fmea_analyses FOR DELETE
    USING (auth.uid() = user_id);

-- Policies pour fmea_items (via la relation avec fmea_analyses)
CREATE POLICY "Users can view FMEA items of their analyses"
    ON fmea_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM fmea_analyses 
        WHERE fmea_analyses.id = fmea_items.fmea_analysis_id 
        AND fmea_analyses.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert FMEA items to their analyses"
    ON fmea_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM fmea_analyses 
        WHERE fmea_analyses.id = fmea_items.fmea_analysis_id 
        AND fmea_analyses.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete FMEA items from their analyses"
    ON fmea_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM fmea_analyses 
        WHERE fmea_analyses.id = fmea_items.fmea_analysis_id 
        AND fmea_analyses.user_id = auth.uid()
    ));

-- Policies pour compliance_analyses
CREATE POLICY "Users can view their own compliance analyses"
    ON compliance_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance analyses"
    ON compliance_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance analyses"
    ON compliance_analyses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compliance analyses"
    ON compliance_analyses FOR DELETE
    USING (auth.uid() = user_id);

-- Policies pour compliance_results
CREATE POLICY "Users can view compliance results of their analyses"
    ON compliance_results FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM compliance_analyses 
        WHERE compliance_analyses.id = compliance_results.compliance_analysis_id 
        AND compliance_analyses.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert compliance results to their analyses"
    ON compliance_results FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM compliance_analyses 
        WHERE compliance_analyses.id = compliance_results.compliance_analysis_id 
        AND compliance_analyses.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete compliance results from their analyses"
    ON compliance_results FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM compliance_analyses 
        WHERE compliance_analyses.id = compliance_results.compliance_analysis_id 
        AND compliance_analyses.user_id = auth.uid()
    ));

COMMIT;
