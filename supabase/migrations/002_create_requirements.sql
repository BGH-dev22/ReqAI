-- 002_create_requirements.sql
-- Table pour stocker les exigences extraites

CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  page_number INTEGER,
  section VARCHAR(255),
  source_text TEXT,
  confidence DECIMAL(3,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_requirements_document_id ON requirements(document_id);
CREATE INDEX idx_requirements_user_id ON requirements(user_id);
CREATE INDEX idx_requirements_type ON requirements(type);
CREATE INDEX idx_requirements_priority ON requirements(priority);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_created_at ON requirements(created_at DESC);

-- Policies (RLS)
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see requirements from their documents"
  ON requirements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert requirements for their documents"
  ON requirements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update requirements from their documents"
  ON requirements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete requirements from their documents"
  ON requirements FOR DELETE
  USING (auth.uid() = user_id);
