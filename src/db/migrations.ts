import { getConnection } from './connection';

export interface Migration {
  id: string;
  name: string;
  up: (db: any) => Promise<void>;
  down: (db: any) => Promise<void>;
}

const migrations: Migration[] = [
  {
    id: '001',
    name: 'init-schema',
    up: async (db) => {
      // Déjà géré par schema.ts
    },
    down: async (db) => {
      // Non implémenté
    },
  },

  // Exemple de migration future :
  // {
  //   id: '002',
  //   name: 'add-achievements',
  //   up: async (db) => {
  //     await db.exec(`
  //       CREATE TABLE IF NOT EXISTS achievements (
  //         id SERIAL PRIMARY KEY,
  //         user_id INTEGER REFERENCES users(id),
  //         type TEXT NOT NULL,
  //         unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  //       );
  //     `);
  //   },
  //   down: async (db) => {
  //     await db.exec('DROP TABLE IF EXISTS achievements;');
  //   },
  // },
];

/**
 * Créer la table de suivi des migrations
 */
export async function initMigrationsTable(): Promise<void> {
  const db = getConnection();
  const type = db.type;

  if (type === 'sqlite') {
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else if (type === 'postgresql') {
    const pgDb = db as any;
    await pgDb.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}

/**
 * Exécuter les migrations en attente
 */
export async function runMigrations(): Promise<void> {
  await initMigrationsTable();

  const db = getConnection();
  const executed = getMigrationsExecuted();

  for (const migration of migrations) {
    if (!executed.includes(migration.id)) {
      console.log(`🔄 Exécution migration: ${migration.id} - ${migration.name}`);
      await migration.up(db);

      if (db.type === 'sqlite') {
        const stmt = db.prepare(
          'INSERT INTO migrations (id, name) VALUES (?, ?)'
        );
        stmt.run(migration.id, migration.name);
      } else {
        const pgDb = db as any;
        await pgDb.query(
          'INSERT INTO migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );
      }

      console.log(`✅ Migration complètement: ${migration.id}`);
    }
  }
}

/**
 * Récupérer les migrations déjà exécutées
 */
function getMigrationsExecuted(): string[] {
  const db = getConnection();

  try {
    if (db.type === 'sqlite') {
      const stmt = db.prepare('SELECT id FROM migrations');
      const rows = stmt.all();
      return rows.map((r: any) => r.id);
    } else {
      const pgDb = db as any;
      const result = pgDb.query('SELECT id FROM migrations');
      return result.rows.map((r: any) => r.id);
    }
  } catch {
    // Table n'existe pas encore
    return [];
  }
}

/**
 * Réinitialiser la base (dev only)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production');
  }

  console.warn('⚠️  Réinitialisation complète de la base de données...');

  const db = getConnection();

  if (db.type === 'sqlite') {
    db.exec(`
      DROP TABLE IF EXISTS match_events;
      DROP TABLE IF EXISTS matches;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS migrations;
    `);
  } else {
    const pgDb = db as any;
    await pgDb.query('DROP TABLE IF EXISTS match_events CASCADE;');
    await pgDb.query('DROP TABLE IF EXISTS matches CASCADE;');
    await pgDb.query('DROP TABLE IF EXISTS users CASCADE;');
    await pgDb.query('DROP TABLE IF EXISTS migrations CASCADE;');
  }

  console.log('✅ Base de données réinitialisée');
}
