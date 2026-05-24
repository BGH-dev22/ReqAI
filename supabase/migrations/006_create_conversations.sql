-- 006_create_conversations.sql
-- Table pour stocker les conversations et leur historique

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Nouvelle conversation',
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  document_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des messages de conversation
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'agent', 'system')),
  content TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON conversation_messages(created_at);

-- Policies (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies via conversation ownership
CREATE POLICY "Users can see messages of their conversations"
  ON conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations"
  ON conversation_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON conversation_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );
