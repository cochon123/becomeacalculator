#!/bin/bash

# QUICK REFERENCE - Les 3 commandes à connaître

# ======================================================
# 1. DÉVELOPPEMENT LOCAL (SQLite)
# ======================================================

# Démarrer le serveur backend
# Terminal 1:
npm run dev

# Démarrer le frontend React
# Terminal 2:
cd client && npm run dev

# → Accéder à http://localhost:5173


# ======================================================
# 2. DÉPLOYER SUR O2SWITCH (PostgreSQL)
# ======================================================

# Compiler
npm run build
cd client && npm run build && cd ..

# Déployer avec script automatique
./scripts/deploy.sh votreserveur.o2switch.fr username production

# → Ou suivre le guide: DEPLOYMENT_POSTGRESQL_O2SWITCH.md


# ======================================================
# 3. AJOUTER UNE FEATURE
# ======================================================

# Exemple : Ajouter un système d'achievements

# 1. Créer une migration dans src/db/migrations.ts
# 2. Créer un service dans src/services/achievementService.ts
# 3. Créer une route dans src/routes/achievements.ts
# 4. Monter la route dans src/server.ts
# 5. Tester localement avec npm run dev
# 6. Déployer avec ./scripts/deploy.sh

# → Voir le guide complet: ARCHITECTURE_EXTENSIBLE.md


# ======================================================
# CONFIGURATION
# ======================================================

# DEV: SQLite (localhost)
# .env
NODE_ENV=development
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/nocalculator.db
FRONTEND_URL=http://localhost:5173

# PROD: PostgreSQL (O2Switch)
# .env
NODE_ENV=production
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/nocalculator
FRONTEND_URL=https://votredomaine.com


# ======================================================
# FICHIERS IMPORTANTS
# ======================================================

# 👉 Commencer: START_HERE.md
# 👉 Déployer: DEPLOYMENT_POSTGRESQL_O2SWITCH.md
# 👉 Ajouter feature: ARCHITECTURE_EXTENSIBLE.md
# 👉 Comprendre: ARCHITECTURE_DIAGRAM.md
# 👉 Index: INDEX_DOCUMENTATION.md


# ======================================================
# DÉPANNAGE RAPIDE
# ======================================================

# Port déjà utilisé?
lsof -i :3001
kill -9 <PID>

# Réinitialiser base de données
npm run db:reset

# Vérifier connexion backend
curl http://localhost:3001/api/health

# Compiler TypeScript
npm run build

# Voir les logs détaillés
npm run dev 2>&1 | tee app.log
