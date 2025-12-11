#!/bin/bash

# Script de déploiement automatisé pour O2Switch
# Usage: ./deploy.sh <server> <username> [production|staging]

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <server> <username> [production|staging]"
    echo "Example: $0 votreserveur.o2switch.fr username production"
    exit 1
fi

SERVER=$1
USERNAME=$2
ENV=${3:-staging}
REMOTE_PATH="/home/$USERNAME/nocalculator"

echo "🚀 Déploiement NoCalculator sur $ENV"
echo "Serveur: $SERVER"
echo "Chemin: $REMOTE_PATH"
echo ""

# ============================================
# 1. BUILD LOCAL
# ============================================
echo "1️⃣  Compilation locale..."
npm run build || { echo "❌ Build frontend échoué"; exit 1; }

echo "2️⃣  Compilation frontend..."
cd client
npm run build || { echo "❌ Build frontend échoué"; exit 1; }
cd ..

echo "3️⃣  Optimisation dépendances..."
npm prune --production

# ============================================
# 2. PRÉPARATION FICHIERS
# ============================================
echo "4️⃣  Préparation fichiers..."

# Créer un répertoire temporaire
DEPLOY_DIR=".deploy_temp"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/{dist,public}

# Copier les fichiers
cp -r dist/* $DEPLOY_DIR/dist/
cp -r client/dist/* $DEPLOY_DIR/public/
cp package.json $DEPLOY_DIR/
cp .env.$ENV $DEPLOY_DIR/.env 2>/dev/null || {
    echo "⚠️  .env.$ENV non trouvé, utiliser .env par défaut"
    cp .env $DEPLOY_DIR/.env
}

# ============================================
# 3. UPLOAD
# ============================================
echo "5️⃣  Upload sur le serveur..."

# Utiliser rsync si disponible (plus rapide)
if command -v rsync &> /dev/null; then
    rsync -avz --delete \
        $DEPLOY_DIR/dist/ \
        $USERNAME@$SERVER:$REMOTE_PATH/dist/
    
    rsync -avz --delete \
        $DEPLOY_DIR/public/ \
        $USERNAME@$SERVER:$REMOTE_PATH/public/
    
    scp $DEPLOY_DIR/package.json $USERNAME@$SERVER:$REMOTE_PATH/
    scp $DEPLOY_DIR/.env $USERNAME@$SERVER:$REMOTE_PATH/
else
    # Fallback à scp
    scp -r $DEPLOY_DIR/dist $USERNAME@$SERVER:$REMOTE_PATH/
    scp -r $DEPLOY_DIR/public $USERNAME@$SERVER:$REMOTE_PATH/
    scp $DEPLOY_DIR/package.json $USERNAME@$SERVER:$REMOTE_PATH/
    scp $DEPLOY_DIR/.env $USERNAME@$SERVER:$REMOTE_PATH/
fi

# ============================================
# 4. POST-DEPLOY
# ============================================
echo "6️⃣  Post-déploiement..."

ssh $USERNAME@$SERVER << 'REMOTECMD'
set -e

echo "Sécurisation fichiers..."
cd /home/$USERNAME/nocalculator
chmod 600 .env
chmod -R 755 public/
chmod -R 755 dist/

echo "Installation dépendances (si nécessaire)..."
npm prune --production > /dev/null 2>&1

echo "Vérification santé..."
if [ -f dist/server.js ]; then
    echo "✅ Fichiers déployés correctement"
else
    echo "❌ Erreur: dist/server.js non trouvé"
    exit 1
fi

echo "📝 Redémarrer manuellement dans cPanel:"
echo "  - Setup Node.js App → Manage App → Stop"
echo "  - Puis → Start"
REMOTECMD

# ============================================
# 5. CLEANUP
# ============================================
echo "7️⃣  Nettoyage..."
rm -rf $DEPLOY_DIR

# ============================================
# 6. FINAL
# ============================================
echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📋 Checklist post-déploiement:"
echo "  [ ] Redémarrer l'app dans cPanel"
echo "  [ ] Vérifier https://$SERVER/api/health"
echo "  [ ] Tester le login et matchmaking"
echo "  [ ] Consulter les logs cPanel en cas d'erreur"
echo ""
