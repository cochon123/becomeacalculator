# Guide de déploiement sur cPanel (O2Switch)

## Prérequis

- Accès cPanel avec Node.js App
- Node.js 18+ disponible
- Accès SSH (recommandé) ou FTP
- Domaine configuré

## Option 1 : Déploiement avec Node.js App (Recommandé)

### 1. Préparer les fichiers en local

```bash
# Backend
npm run build
npm prune --production  # Supprimer dev dependencies

# Frontend
cd client
npm run build
cd ..
```

### 2. Upload via FTP/SSH

Créer la structure suivante sur le serveur :

```
/home/username/nocalculator/
├── dist/              # Backend compilé
├── node_modules/      # Dépendances production uniquement
├── data/              # Base de données SQLite
├── package.json
├── .env              # Variables d'environnement
└── public/           # Frontend compilé (client/dist/)
```

### 3. Configurer .env sur le serveur

```bash
PORT=3001
NODE_ENV=production
JWT_SECRET=VOTRE_SECRET_TRES_ALEATOIRE_ET_SECURISE
DATABASE_PATH=./data/nocalculator.db
FRONTEND_URL=https://votredomaine.com
```

### 4. Configurer Node.js App dans cPanel

1. Aller dans **Setup Node.js App**
2. Créer une nouvelle application :
   - **Node.js version** : 18.x ou supérieur
   - **Application mode** : Production
   - **Application root** : `/home/username/nocalculator`
   - **Application URL** : Votre domaine ou sous-domaine
   - **Application startup file** : `dist/server.js`
3. Variables d'environnement :
   - `PORT` : 3001 (ou le port assigné par cPanel)
   - `NODE_ENV` : production
   - `JWT_SECRET` : Votre secret
   - `DATABASE_PATH` : `./data/nocalculator.db`
   - `FRONTEND_URL` : URL de votre site
4. Cliquer sur **Create**
5. Une fois créé, cliquer sur **Run NPM Install** si nécessaire
6. Cliquer sur **Start** pour démarrer l'application

### 5. Servir le frontend

Deux options :

#### Option A : Apache avec proxy (Recommandé pour O2Switch)

Créer/modifier `.htaccess` à la racine du domaine :

```apache
RewriteEngine On

# WebSocket proxy
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) ws://127.0.0.1:3001/$1 [P,L]

# API proxy
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^/?(.*) http://127.0.0.1:3001/$1 [P,L]

# Frontend SPA fallback
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

Copier le contenu de `client/dist/` à la racine du domaine.

#### Option B : Node.js sert tout

Modifier `src/server.ts` pour servir les fichiers statiques :

```typescript
import path from 'path';

// Après les routes API
app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
```

Copier `client/dist/` vers `public/` sur le serveur.

## Option 2 : Déploiement manuel avec PM2 (via SSH)

### 1. Se connecter en SSH

```bash
ssh username@votreserveur.com
```

### 2. Cloner ou uploader le projet

```bash
cd ~
mkdir nocalculator
cd nocalculator
# Upload via scp ou git clone
```

### 3. Installer les dépendances et compiler

```bash
npm install
npm run build

cd client
npm install
npm run build
cd ..
```

### 4. Configurer .env

```bash
cp .env.example .env
nano .env  # Éditer avec les bonnes valeurs
```

### 5. Installer PM2

```bash
npm install -g pm2
```

### 6. Démarrer avec PM2

```bash
pm2 start dist/server.js --name "nocalculator"
pm2 save
pm2 startup  # Suivre les instructions pour démarrage auto
```

### 7. Vérifier les logs

```bash
pm2 logs nocalculator
pm2 status
```

## Option 3 : Base de données PostgreSQL (pour scalabilité)

Si vous prévoyez beaucoup de joueurs, remplacer SQLite par PostgreSQL :

### 1. Installer pg

```bash
npm install pg
npm uninstall better-sqlite3
```

### 2. Modifier `src/db/database.ts`

```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Adapter les requêtes SQL (? → $1, $2, etc.)
```

### 3. Ajouter DATABASE_URL dans .env

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/nocalculator
```

### 4. Créer la base

```bash
psql -U user -d nocalculator -f schema.sql
```

## Maintenance

### Mettre à jour l'application

```bash
# Sur le serveur
cd ~/nocalculator
git pull  # Ou upload nouveaux fichiers
npm run build
pm2 restart nocalculator  # Ou redémarrer via cPanel
```

### Sauvegarder la base de données

```bash
# SQLite
cp data/nocalculator.db data/nocalculator.db.backup

# PostgreSQL
pg_dump nocalculator > backup.sql
```

### Monitorer les logs

```bash
# PM2
pm2 logs nocalculator

# cPanel Node.js App
Voir les logs dans l'interface cPanel
```

## Résolution de problèmes

### WebSocket ne fonctionne pas

- Vérifier que le proxy WebSocket est configuré dans `.htaccess`
- Vérifier les CORS dans `src/server.ts`
- Tester avec `wss://` au lieu de `ws://` si HTTPS

### L'application redémarre constamment

- Vérifier les logs : `pm2 logs`
- Vérifier que le port n'est pas déjà utilisé
- Vérifier les permissions sur le dossier `data/`

### Erreurs de base de données

```bash
# Recréer la base
rm data/nocalculator.db
node dist/db/init.js  # Ou redémarrer l'app
```

## Optimisations production

### 1. Compression

Installer compression middleware :

```bash
npm install compression
```

```typescript
import compression from 'compression';
app.use(compression());
```

### 2. Rate limiting

Déjà implémenté dans `src/server.ts`, ajuster les limites si nécessaire.

### 3. HTTPS

O2Switch fournit SSL gratuit (Let's Encrypt). L'activer dans cPanel.

### 4. CDN (optionnel)

Héberger les assets statiques sur un CDN (Cloudflare, etc.) pour améliorer les performances.

## Checklist finale

- [ ] .env configuré avec JWT_SECRET sécurisé
- [ ] Backend compilé (`npm run build`)
- [ ] Frontend compilé (`cd client && npm run build`)
- [ ] Base de données initialisée
- [ ] Node.js App démarré dans cPanel
- [ ] Frontend accessible via le domaine
- [ ] API accessible (`/api/health`)
- [ ] WebSocket fonctionne
- [ ] Tests login/matchmaking avec deux navigateurs
- [ ] SSL/HTTPS activé
- [ ] Backups configurés

## Support

- Documentation Node.js App O2Switch : https://faq.o2switch.fr/hebergement-mutualise/tutoriels-cpanel/nodejs-app
- Socket.io docs : https://socket.io/docs/v4/
- PM2 docs : https://pm2.keymetrics.io/docs/usage/quick-start/
