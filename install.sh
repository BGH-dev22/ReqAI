#!/bin/bash
# Script d'installation rapide - Plateforme IA Multi-Agent

set -e

echo "🚀 Installation de la Plateforme IA Multi-Agent"
echo "================================================"
echo ""

# Vérifier les prérequis
echo "✓ Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+."
    exit 1
fi

if ! command -v python &> /dev/null; then
    echo "❌ Python n'est pas installé. Veuillez installer Python 3.10+."
    exit 1
fi

echo "✓ Tous les prérequis sont présents"
echo ""

# Créer le fichier .env
echo "📝 Création du fichier .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Fichier .env créé (éditer si nécessaire)"
else
    echo "✓ Fichier .env déjà présent"
fi
echo ""

# Installer les dépendances Frontend
echo "📦 Installation des dépendances Frontend..."
if [ -f "package.json" ]; then
    npm install
    echo "✓ Dépendances Frontend installées"
else
    echo "⚠️  package.json non trouvé - à créer"
fi
echo ""

# Installer les dépendances Backend
echo "🐍 Installation des dépendances Backend..."
if [ -f "agents/requirements.txt" ]; then
    pip install -r agents/requirements.txt
    echo "✓ Dépendances Backend installées"
else
    echo "⚠️  requirements.txt non trouvé"
fi
echo ""

# Démarrer les services Docker
echo "🐳 Démarrage des services Docker..."
docker-compose up -d
echo "✓ Services Docker démarrés"
echo ""

# Attendre que Supabase soit prêt
echo "⏳ Attente de l'initialisation de Supabase (30 secondes)..."
sleep 30
echo "✓ Supabase initialisé"
echo ""

# Informations d'accès
echo "✅ Installation complète!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 URLs d'accès:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Frontend:        http://localhost:5173"
echo "Supabase Studio: http://localhost:54323"
echo "Ollama API:      http://localhost:11434"
echo "Python Backend:  http://localhost:8000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 Prochaines étapes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Démarrer le serveur de développement:"
echo "   npm run dev"
echo ""
echo "2. Accéder à l'application:"
echo "   http://localhost:5173"
echo ""
echo "3. Consulter la documentation:"
echo "   cat README.md"
echo ""
echo "✨ Plateforme prête à l'emploi!"
echo ""
