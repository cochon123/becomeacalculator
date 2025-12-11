import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export type DatabaseType = 'sqlite' | 'postgresql';

export interface DatabaseConnection {
  type: DatabaseType;
  exec(sql: string): void;
  prepare(sql: string): PreparedStatement;
  close?(): Promise<void>;
  connect?(): Promise<void>;
}

export interface PreparedStatement {
  run(...params: any[]): RunResult;
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

export interface RunResult {
  changes: number;
  lastID?: number;
  lastInsertRowid?: number;
}

let connection: DatabaseConnection | null = null;

/**
 * Initialiser la connexion SQLite synchrone (par défaut)
 */
function initSQLiteSync(): DatabaseConnection {
  const { SQLiteConnection } = require('./sqlite');
  const conn = new SQLiteConnection();
  // SQLite est synchrone - pas besoin d'await
  const dbPath = process.env.DATABASE_PATH || './data/nocalculator.db';
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return conn;
}

/**
 * Créer une connexion DB en fonction de l'env
 */
export async function createConnection(): Promise<DatabaseConnection> {
  if (connection) return connection;

  const dbType = process.env.DATABASE_TYPE || 'sqlite';

  if (dbType === 'postgresql') {
    const { PostgreSQLConnection } = await import('./postgresql');
    connection = new PostgreSQLConnection();
    await connection.connect?.();
  } else {
    connection = initSQLiteSync();
    await connection.connect?.();
  }

  return connection;
}

/**
 * Récupérer la connexion actuelle (ou initialiser synchrone si SQLite)
 */
export function getConnection(): DatabaseConnection {
  if (!connection) {
    // Initialiser SQLite synchronement si pas encore connecté
    const dbType = process.env.DATABASE_TYPE || 'sqlite';
    if (dbType === 'sqlite') {
      connection = initSQLiteSync();
    } else {
      throw new Error('PostgreSQL connection not initialized. Call createConnection() first.');
    }
  }
  return connection;
}

/**
 * Fermer la connexion
 */
export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.close?.();
    connection = null;
  }
}
