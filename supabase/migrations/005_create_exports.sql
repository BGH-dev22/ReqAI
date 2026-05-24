-- 005_create_exports.sql
-- Table pour tracker les exports

CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL,
  file_size BIGINT,
  storage_url VARCHAR(1024),
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- Indexes
CREATE INDEX idx_exports_document_id ON exports(document_id);
CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_created_at ON exports(created_at DESC);
CREATE INDEX idx_exports_expires_at ON exports(expires_at);

-- Policies (RLS)
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own exports"
  ON exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports for their documents"
  ON exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
  ON exports FOR DELETE
  USING (auth.uid() = user_id);
