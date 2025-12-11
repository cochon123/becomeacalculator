import { getConnection } from './connection';

/**
 * Schéma DDL pour SQLite et PostgreSQL
 */
export const SCHEMA = {
  sqlite: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      elo INTEGER DEFAULT 1000,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      questions TEXT NOT NULL,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      winner_id INTEGER,
      status TEXT DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS match_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      player_id INTEGER NOT NULL,
      question_index INTEGER NOT NULL,
      answer INTEGER NOT NULL,
      correct BOOLEAN NOT NULL,
      time_ms INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches(id),
      FOREIGN KEY (player_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo DESC);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
  `,

  postgresql: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      elo INTEGER DEFAULT 1000,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      player1_id INTEGER NOT NULL REFERENCES users(id),
      player2_id INTEGER NOT NULL REFERENCES users(id),
      questions TEXT NOT NULL,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      winner_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'waiting',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS match_events (
      id SERIAL PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES matches(id),
      player_id INTEGER NOT NULL REFERENCES users(id),
      question_index INTEGER NOT NULL,
      answer INTEGER NOT NULL,
      correct BOOLEAN NOT NULL,
      time_ms INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo DESC);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
  `,
};

/**
 * Initialiser la base de données avec le schéma approprié
 */
export async function initDatabase(): Promise<void> {
  const db = getConnection();

  if (db.type === 'sqlite') {
    db.exec(SCHEMA.sqlite);
  } else if (db.type === 'postgresql') {
    const pgDb = db as any;
    // Split queries for PostgreSQL
    const queries = SCHEMA.postgresql
      .split(';')
      .filter((q) => q.trim());
    for (const query of queries) {
      if (query.trim()) {
        await pgDb.query(query.trim());
      }
    }
  }

  console.log('✅ Base de données initialisée');
}
