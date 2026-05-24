-- Migration complète pour la Plateforme Multi-Agent
-- Créé le: 2025-12-14

BEGIN;

-- Extension pgvector pour les embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- TABLE: documents
-- ==========================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx')),
    file_size INTEGER,
    status TEXT NOT NULL DEFAULT 'uploading' 
        CHECK (status IN ('uploading', 'parsing', 'analyzing', 'completed', 'error')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: requirements
-- ==========================================
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    req_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL 
        CHECK (type IN ('fonctionnelle', 'performance', 'interface', 'sécurité', 'qualité')),
    priority TEXT NOT NULL 
        CHECK (priority IN ('Haute', 'Moyenne', 'Basse')),
    source_page INTEGER,
    source_section TEXT,
    confidence FLOAT DEFAULT 0.0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, req_id)
);

-- ==========================================
-- TABLE: test_cases
-- ==========================================
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL,
    objective TEXT NOT NULL,
    preconditions TEXT,
    procedure JSONB NOT NULL DEFAULT '[]'::jsonb,
    inputs JSONB DEFAULT '[]'::jsonb,
    thresholds JSONB DEFAULT '[]'::jsonb,
    expected_result TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: embeddings (pour RAG)
-- ==========================================
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(384),
    page_number INTEGER,
    section TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, chunk_id)
);

-- ==========================================
-- TABLE: citations
-- ==========================================
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    cited_text TEXT NOT NULL,
    source_page INTEGER,
    source_section TEXT,
    relevance_score FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: exports
-- ==========================================
CREATE TABLE IF NOT EXISTS exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('excel', 'json', 'pdf', 'csv')),
    file_path TEXT NOT NULL,
    file_size INTEGER,
    options JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_requirements_document_id ON requirements(document_id);
CREATE INDEX IF NOT EXISTS idx_requirements_type ON requirements(type);
CREATE INDEX IF NOT EXISTS idx_requirements_priority ON requirements(priority);

CREATE INDEX IF NOT EXISTS idx_test_cases_requirement_id ON test_cases(requirement_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_document_id ON test_cases(document_id);

CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_citations_document_id ON citations(document_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Fonction de recherche sémantique
CREATE OR REPLACE FUNCTION search_embeddings(
    query_embedding vector(384),
    doc_id UUID,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    chunk_text TEXT,
    page_number INTEGER,
    section TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.chunk_text,
        e.page_number,
        e.section,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM embeddings e
    WHERE e.document_id = doc_id
        AND 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at
    BEFORE UPDATE ON requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_cases_updated_at
    BEFORE UPDATE ON test_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- Policies pour documents
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- Policies pour requirements (via documents)
CREATE POLICY "Users can view requirements"
    ON requirements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = requirements.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- Policies pour test_cases
CREATE POLICY "Users can view test_cases"
    ON test_cases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = test_cases.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- Policies pour embeddings
CREATE POLICY "Users can view embeddings"
    ON embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = embeddings.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- Policies pour citations
CREATE POLICY "Users can view citations"
    ON citations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = citations.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- Policies pour exports
CREATE POLICY "Users can view own exports"
    ON exports FOR SELECT
    USING (auth.uid() = user_id);

COMMIT;
