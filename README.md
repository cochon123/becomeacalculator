# NoCalculator 🧮

Jeu de calcul mental compétitif en temps réel avec système ELO.

## Architecture

- **Backend**: Node.js + TypeScript + Express + Socket.io + SQLite
- **Frontend**: React + TypeScript + Vite + Socket.io-client

## Fonctionnalités

✅ **Authentification**: Register/Login avec JWT + bcrypt  
✅ **Matchmaking**: File d'attente avec matching par ELO (±100-200)  
✅ **Questions déterministes**: Génération côté serveur avec seed  
✅ **Temps réel**: WebSocket (Socket.io) pour synchronisation scores  
✅ **Système ELO**: Calcul automatique post-match  
✅ **Leaderboard**: Classement des meilleurs joueurs  
✅ **Server-authoritative**: Validation côté serveur pour éviter triche  
✅ **Animations**: Feedback visuel (vert/rouge) pour réponses correctes/incorrectes  

## Installation

### Backend

```bash
# Installer les dépendances
npm install

# Copier et configurer .env
cp .env.example .env

# Compiler TypeScript
npm run build

# Démarrer le serveur
npm run dev
```

Le backend démarre sur `http://localhost:3000`

### Frontend

```bash
cd client

# Installer les dépendances
npm install

# Démarrer le dev server
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

## Structure du projet

```
nocalculator/
├── src/                    # Backend
│   ├── db/
│   │   └── database.ts     # Config SQLite + schéma
│   ├── middleware/
│   │   └── auth.ts         # JWT middleware
│   ├── routes/
│   │   ├── auth.ts         # Register/Login
│   │   └── leaderboard.ts  # Classement
│   ├── services/
│   │   ├── userService.ts
│   │   ├── matchService.ts
│   │   ├── questionService.ts  # Génération déterministe
│   │   ├── eloService.ts       # Calcul ELO
│   │   └── matchmakingService.ts
│   ├── socket/
│   │   └── gameSocket.ts   # WebSocket handlers
│   ├── types/
│   │   └── index.ts
│   └── server.ts           # Point d'entrée
└── client/                 # Frontend
    └── src/
        ├── components/
        │   ├── Login.tsx
        │   ├── Lobby.tsx
        │   └── Game.tsx
        ├── services/
        │   ├── api.ts
        │   └── socket.ts
        └── App.tsx
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur actuel
- `POST /api/auth/logout` - Déconnexion

### Leaderboard
- `GET /api/leaderboard` - Top joueurs
- `GET /api/leaderboard/user/:id` - Stats utilisateur

## WebSocket Events

### Client → Server
- `join_queue` - Rejoindre file d'attente
- `leave_queue` - Quitter file
- `join_match` - Rejoindre un match
- `submit_answer` - Soumettre réponse

### Server → Client
- `queue_joined` - Confirmation entrée queue
- `match_found` - Match trouvé
- `answer_submitted` - Réponse validée
- `match_finished` - Match terminé

## Génération des questions

Les questions sont générées de manière **déterministe** côté serveur :
- Seed basé sur match_id
- 20 questions par match
- Difficulté progressive (+ multiplication/division)
- Division garantit résultat entier

## Système ELO

- ELO initial : 1000
- K-factor : 32
- Mise à jour après chaque match
- Pas de changement en cas d'égalité

## Déploiement cPanel (O2Switch)

### Prérequis
- Node.js 18+ sur le serveur
- Accès SSH
- Base de données SQLite ou PostgreSQL

### Steps
1. Compiler le backend : `npm run build`
2. Compiler le frontend : `cd client && npm run build`
3. Upload via FTP/SFTP :
   - Backend : `dist/`, `node_modules/`, `package.json`, `.env`
   - Frontend : `client/dist/` → répertoire public
4. Configurer variables d'environnement
5. Démarrer avec PM2 ou Node.js App dans cPanel

## Développement

### Backend
```bash
npm run dev  # Auto-reload avec ts-node-dev
```

### Frontend
```bash
cd client && npm run dev  # Hot reload avec Vite
```

### Tests
Ouvrir deux navigateurs différents, créer deux comptes, lancer matchmaking pour tester le jeu en temps réel.

## TODO

- [ ] Améliorer animations (Framer Motion)
- [ ] Ajouter sons (Howler.js)
- [ ] Mode entraînement solo
- [ ] Historique des matchs
- [ ] Système d'amis
- [ ] Rooms privées
- [ ] Mobile responsive amélioré
- [ ] Tests unitaires/E2E

## License

MIT
