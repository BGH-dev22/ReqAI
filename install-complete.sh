# Installation automatique du projet

echo "🚀 Installation de la Plateforme IA Multi-Agent"

# 1. Installer les dépendances frontend
echo "📦 Installation des dépendances frontend..."
npm install --legacy-peer-deps

# 2. Installer les dépendances Python
echo "🐍 Installation des dépendances Python..."
pip install -r agents/requirements.txt

# 3. Initialiser Supabase
echo "🗄️ Initialisation de Supabase..."
supabase init
supabase start

# 4. Appliquer les migrations
echo "🔄 Application des migrations..."
supabase db reset

# 5. Générer les types TypeScript
echo "📝 Génération des types..."
npm run typegen

# 6. Démarrer Ollama et télécharger les modèles
echo "🤖 Configuration d'Ollama..."
docker-compose up -d ollama
sleep 10
docker exec -it ollama ollama pull llama3.1
docker exec -it ollama ollama pull qwen2
docker exec -it ollama ollama pull phi

echo "✅ Installation terminée!"
echo ""
echo "Pour démarrer le projet:"
echo "  Terminal 1: npm run dev"
echo "  Terminal 2: cd agents && uvicorn api:app --reload"
echo ""
echo "URLs:"
echo "  - Frontend: http://localhost:5173"
echo "  - API Agents: http://localhost:8000"
echo "  - Supabase Studio: http://localhost:54323"
