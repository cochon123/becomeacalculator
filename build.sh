#!/bin/bash

# Script de build pour production
# Usage: ./build.sh

set -e  # Arrêt en cas d'erreur

echo "🏗️  Build NoCalculator pour production"
echo ""

# Backend
echo "📦 Build backend..."
npm run build

echo "✅ Backend compilé dans dist/"
echo ""

# Frontend
echo "📦 Build frontend..."
cd client
npm run build
cd ..

echo "✅ Frontend compilé dans client/dist/"
echo ""

# Créer le dossier de déploiement
echo "📁 Création du dossier deploy/..."
rm -rf deploy
mkdir -p deploy
mkdir -p deploy/public
mkdir -p deploy/data

# Copier les fichiers backend
echo "📋 Copie des fichiers backend..."
cp -r dist deploy/
cp package.json deploy/
cp .env.example deploy/
echo "NODE_ENV=production" > deploy/.env

# Copier le frontend compilé
echo "📋 Copie du frontend..."
cp -r client/dist/* deploy/public/

# Créer un README pour le déploiement
cat > deploy/README.txt << 'EOF'
Déploiement NoCalculator
========================

1. Configurer .env avec vos paramètres
2. Installer les dépendances : npm install --production
3. Initialiser la base de données (automatique au premier démarrage)
4. Démarrer : node dist/server.js

Ou utiliser PM2 :
pm2 start dist/server.js --name nocalculator
pm2 save

Voir DEPLOYMENT.md pour plus de détails.
EOF

echo ""
echo "✅ Build terminé !"
echo ""
echo "📦 Fichiers prêts dans le dossier deploy/"
echo ""
echo "Prochaines étapes :"
echo "1. cd deploy"
echo "2. Configurer .env"
echo "3. npm install --production"
echo "4. Upload sur le serveur ou démarrer localement"
echo ""
