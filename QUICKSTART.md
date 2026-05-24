# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## ⚡ Démarrage en 5 minutes

### Option 1: Installation Automatique (Linux/Mac)

```bash
# Rendre le script exécutable
chmod +x install.sh

# Lancer l'installation automatique
./install.sh
```

### Option 2: Installation Manuelle

#### 1️⃣ Préparation

```bash
# Se placer dans le répertoire du projet
cd makerkit

# Créer le fichier .env
cp .env.example .env
```

#### 2️⃣ Démarrer les services

```bash
# Lancer tous les services (Frontend, Backend, Supabase, Ollama)
docker-compose up -d

# Vérifier que tout est démarré
docker-compose ps
```

#### 3️⃣ Installation des dépendances

```bash
# Frontend
npm install

# Backend (Python)
pip install -r agents/requirements.txt
```

#### 4️⃣ Démarrer le développement

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2 (optionnel): Backend
python -m uvicorn agents.api:app --reload --host 0.0.0.0
```

---

## 🌐 Accès aux Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | - |
| **Supabase Studio** | http://localhost:54323 | email: test@test.com |
| **Ollama API** | http://localhost:11434 | - |
| **API Backend** | http://localhost:8000 | - |
| **API Docs** | http://localhost:8000/docs | - |

---

## 📋 Checklist de Vérification

- [ ] Docker Compose services sont actifs (`docker-compose ps`)
- [ ] Frontend accessible à http://localhost:5173
- [ ] Supabase Studio accessible et connecté
- [ ] Ollama répond à http://localhost:11434
- [ ] Page d'accueil affiche les objectifs
- [ ] Composants UI chargent correctement

---

## 🛠️ Commandes Utiles

### Frontend
```bash
npm run dev        # Démarrer en développement
npm run build      # Build production
npm run preview    # Prévisualiser build
npm run lint       # Vérifier le code
```

### Backend
```bash
python -m pytest                    # Lancer les tests
python -m pytest agents/            # Tests agents
black agents/                       # Formater le code
mypy agents/                        # Vérifier les types
```

### Docker
```bash
docker-compose up -d               # Démarrer les services
docker-compose down                # Arrêter les services
docker-compose logs -f             # Voir les logs
docker-compose ps                  # État des services
```

### Supabase
```bash
# Exécuter les migrations
supabase db push

# Voir l'état
supabase status
```

---

## 🐛 Troubleshooting

### Le Frontend ne démarre pas

```bash
# Vérifier Node.js
node --version    # Doit être >= 18

# Nettoyer les dépendances
rm -rf node_modules package-lock.json
npm install

# Redémarrer le serveur
npm run dev
```

### Supabase ne se connecte pas

```bash
# Vérifier que Docker tourne
docker-compose ps

# Redémarrer Supabase
docker-compose restart supabase

# Vérifier les logs
docker-compose logs supabase
```

### Ollama n'est pas accessible

```bash
# Vérifier que Ollama tourne
docker-compose ps | grep ollama

# Télécharger les modèles
docker exec makerkit-ollama-1 ollama pull llama2
docker exec makerkit-ollama-1 ollama pull qwen2

# Tester l'API
curl http://localhost:11434/api/tags
```

### Erreur de base de données

```bash
# Vérifier PostgreSQL
docker-compose logs postgres

# Réappliquer les migrations
docker exec -it makerkit-supabase-1 \
  psql -U postgres -f /docker-entrypoint-initdb.d/001_create_documents.sql

# Réinitialiser la base (destructif!)
docker-compose down -v
docker-compose up -d
```

---

## 📊 Vérifier l'Installation

### Frontend OK ✅
```bash
curl http://localhost:5173
# Doit retourner du HTML
```

### Supabase OK ✅
```bash
curl http://localhost:54321/rest/v1/
# Doit retourner du JSON
```

### Ollama OK ✅
```bash
curl http://localhost:11434/api/tags
# Doit retourner une liste de modèles
```

### Python Backend OK ✅
```bash
curl http://localhost:8000/docs
# Doit retourner la documentation Swagger
```

---

## 📚 Documentation Complète

- [README.md](./README.md) - Documentation générale
- [STRUCTURE.md](./STRUCTURE.md) - Structure du projet
- [CREATION_SUMMARY.md](./CREATION_SUMMARY.md) - Récapitulatif création
- [TREE.md](./TREE.md) - Arborescence complète

---

## 🔐 Sécurité

### Secrets par défaut (développement seulement)

⚠️ **Ne pas utiliser en production!**

```env
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
POSTGRES_PASSWORD=postgres
```

En production, générer des secrets forts:
```bash
openssl rand -base64 32
```

---

## 💾 Backup et Restauration

### Backup de la base de données

```bash
docker exec makerkit-supabase-1 \
  pg_dump -U postgres postgres > backup.sql
```

### Restauration

```bash
docker exec -i makerkit-supabase-1 \
  psql -U postgres postgres < backup.sql
```

---

## 📈 Performance

### Monitorer les services

```bash
# Ressources utilisées
docker stats

# Logs détaillés
docker-compose logs -f --tail=100
```

### Optimisations

- Redis cache activé pour les requêtes fréquentes
- pgvector indexé pour recherche sémantique rapide
- Frontend minifié et bundled

---

## 🆘 Support

### En cas de problème:

1. **Vérifier les logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Redémarrer les services:**
   ```bash
   docker-compose restart
   ```

3. **Réinitialiser complètement:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

4. **Consulter la documentation:**
   - README.md
   - CREATION_SUMMARY.md
   - STRUCTURE.md

---

## ✨ Prochaines étapes

1. ✅ Vérifier que tout fonctionne
2. 📖 Lire le [README.md](./README.md)
3. 🚀 Explorer les pages:
   - Home: http://localhost:5173/
   - Upload: http://localhost:5173/upload
   - Q&A: http://localhost:5173/qa
   - Tests: http://localhost:5173/tests
   - Export: http://localhost:5173/export
4. 💻 Commencer le développement

---

**🎉 Vous êtes prêt(e)! Happy coding!**
