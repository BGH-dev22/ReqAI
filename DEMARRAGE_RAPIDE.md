# 🚀 Guide de Démarrage Rapide

## ✅ Ce qui est déjà configuré

- Frontend React + Vite + Tailwind ✅
- 5 pages complètes (Home, Upload, QA, Tests, Export) ✅
- 13 composants UI (shadcn) ✅
- Structure agents Python ✅
- Configuration Docker ✅
- PostCSS + Tailwind ✅

## 📋 Prochaines étapes

### 1. Configurer Supabase Local

```bash
# Installer Supabase CLI
npm install -g supabase

# Initialiser
supabase init

# Démarrer Supabase local
supabase start

# Appliquer la migration
supabase db reset
```

### 2. Configurer les variables d'environnement

Créez `.env` à la racine :

```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-start

# Agents API
VITE_AGENTS_API_URL=http://localhost:8000

# Ollama
VITE_OLLAMA_URL=http://localhost:11434
```

### 3. Installer les modèles Ollama

```bash
# Démarrer Ollama
docker-compose up -d ollama

# Télécharger les modèles
ollama pull llama3.1
ollama pull qwen2
ollama pull phi
```

### 4. Installer les dépendances Python complètes

```bash
cd agents
pip install -r requirements.txt
```

### 5. Démarrer l'application

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - API Agents:**
```bash
cd agents
python api.py
```

**Terminal 3 - Supabase:**
```bash
supabase start
```

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Application React |
| API Agents | http://localhost:8000 | FastAPI backend |
| API Docs | http://localhost:8000/docs | Documentation Swagger |
| Supabase Studio | http://localhost:54323 | Interface DB |
| Ollama | http://localhost:11434 | LLM local |

## 🔧 Configuration restante

### Implémenter les agents Python

Les fichiers squelettes existent dans `agents/*/agent.py`. Vous devez :

1. **ParsingAgent** (`agents/parsing_agent/agent.py`)
   - Implémenter `_extract_pdf()`
   - Implémenter `_extract_docx()`
   - Implémenter `_extract_tables()`

2. **AnalysisAgent** (`agents/analysis_agent/agent.py`)
   - Implémenter `extract_requirements()`
   - Implémenter `classify_requirement()`

3. **QAAgent** (`agents/qa_agent/agent.py`)
   - Implémenter `index_document()`
   - Implémenter `answer_question()`

4. **TestGeneratorAgent** (`agents/test_generator_agent/agent.py`)
   - Implémenter `generate_tests()`
   - Implémenter `generate_traceability_matrix()`

5. **ExportAgent** (`agents/export_agent/agent.py`)
   - Implémenter les exports (Excel, JSON, PDF, CSV)

### Créer le bucket Supabase Storage

```sql
-- Dans Supabase Studio SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid() = owner);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid() = owner);
```

### Générer les types TypeScript

```bash
npm run typegen
```

Cela créera `supabase/database.types.ts` avec tous les types de la DB.

## 📚 Ressources

- [Documentation MakerKit](https://makerkit.dev)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation LangGraph](https://langchain-ai.github.io/langgraph/)
- [Documentation Ollama](https://ollama.ai/docs)

## 🐛 Troubleshooting

### Le frontend ne charge pas les styles
```bash
npm install -D @tailwindcss/postcss --legacy-peer-deps
npm run dev
```

### Supabase ne démarre pas
```bash
supabase stop
supabase start
```

### Les agents Python ne fonctionnent pas
```bash
cd agents
pip install -r requirements.txt --upgrade
python api.py
```

## ✨ Tester l'application

1. Ouvrez http://localhost:5173
2. Cliquez sur "Commencer l'Analyse"
3. Uploadez un document PDF ou DOCX
4. Observez la progression multi-agent
5. Consultez les exigences extraites
6. Posez des questions (Q&A)
7. Générez les tests
8. Exportez les résultats

## 🎯 Architecture actuelle

```
✅ Frontend (React + Vite)
   ├── 5 pages complètes
   ├── 13 composants UI
   └── Hooks: useDocument, useAgents

✅ Base de données (Supabase)
   ├── Schema SQL complet
   ├── RLS policies
   └── Fonction search_embeddings

🟡 Backend Python (Agents)
   ├── Structure créée
   ├── API FastAPI
   └── ⚠️ Logique à implémenter

🟡 LangGraph
   ├── Orchestrator créé
   └── ⚠️ Agents à connecter

✅ Configuration
   ├── Docker Compose
   ├── Tailwind + PostCSS
   └── TypeScript
```

## 📈 Prochains Sprints

**Sprint 1 (Semaine 2):**
- Finir ParsingAgent
- Finir AnalysisAgent
- Tests unitaires

**Sprint 2 (Semaine 3):**
- Finir QAAgent + RAG
- Finir CitationAgent
- Tests d'intégration

**Sprint 3 (Semaine 4):**
- Finir TestGeneratorAgent
- Finir ExportAgent
- Tests E2E

**Sprint 4-7:**
- Optimisations
- UI/UX polish
- Documentation
- Déploiement

---

Bon courage ! 🚀
