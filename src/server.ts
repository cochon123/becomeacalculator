import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createConnection, initDatabase, runMigrations } from './db/database';
import { initializeWebSocket } from './socket/gameSocket';
import authRoutes from './routes/auth';
import leaderboardRoutes from './routes/leaderboard';
import testRoutes from './routes/test';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, réessayez plus tard',
});

// Liste des origines autorisées (localhost + réseau local)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,  // Réseau local 10.x.x.x
  /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Réseau local 192.168.x.x
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (apps mobiles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS non autorisé'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/', limiter);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/test', testRoutes);

// Initialiser WebSocket
initializeWebSocket(server);

// Initialiser la base de données et démarrer le serveur
async function start() {
  try {
    console.log('🔧 Initialisation de la base de données...');
    await createConnection();
    await initDatabase();
    await runMigrations();

    server.listen(Number(PORT), HOST, () => {
      console.log(`🚀 Serveur démarré sur http://${HOST}:${PORT}`);
      console.log(`🔗 Type de base: ${process.env.DATABASE_TYPE || 'sqlite'}`);
      console.log(`🎮 WebSocket prêt pour les matchs en temps réel`);
      console.log(`🧪 Mode test: GET /api/test/solo pour tester le gameplay`);
      console.log(`🌐 Accessible sur le réseau local: http://10.0.0.163:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
    process.exit(1);
  }
}

start();

export default app;
