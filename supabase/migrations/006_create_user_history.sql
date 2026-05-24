-- 006_create_user_history.sql
-- Tables pour l'historique des utilisateurs

-- Table pour l'historique des conversations Q&A
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches rapides
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_document_id ON chat_history(document_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);

-- RLS pour chat_history
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own chat history"
  ON chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
  ON chat_history FOR DELETE
  USING (auth.uid() = user_id);


-- Table pour l'historique des tests générés
CREATE TABLE IF NOT EXISTS test_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id VARCHAR(255) NOT NULL,
  requirement_id VARCHAR(255) NOT NULL,
  requirement_title VARCHAR(500),
  test_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches rapides
CREATE INDEX idx_test_history_user_id ON test_history(user_id);
CREATE INDEX idx_test_history_document_id ON test_history(document_id);
CREATE INDEX idx_test_history_requirement_id ON test_history(requirement_id);
CREATE INDEX idx_test_history_created_at ON test_history(created_at DESC);

-- RLS pour test_history
ALTER TABLE test_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own test history"
  ON test_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test history"
  ON test_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test history"
  ON test_history FOR DELETE
  USING (auth.uid() = user_id);


-- Table pour les profils utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(100),
  avatar_url VARCHAR(1024),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS pour user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
