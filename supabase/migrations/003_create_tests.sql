-- 003_create_tests.sql
-- Table pour stocker les cas de test générés

CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  preconditions JSONB,
  steps JSONB NOT NULL,
  expected_result TEXT,
  notes TEXT,
  coverage DECIMAL(3,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_test_cases_document_id ON test_cases(document_id);
CREATE INDEX idx_test_cases_requirement_id ON test_cases(requirement_id);
CREATE INDEX idx_test_cases_user_id ON test_cases(user_id);
CREATE INDEX idx_test_cases_type ON test_cases(type);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_created_at ON test_cases(created_at DESC);

-- Policies (RLS)
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see test cases from their documents"
  ON test_cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert test cases for their documents"
  ON test_cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update test cases from their documents"
  ON test_cases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete test cases from their documents"
  ON test_cases FOR DELETE
  USING (auth.uid() = user_id);
