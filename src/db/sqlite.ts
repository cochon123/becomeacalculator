import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DatabaseConnection, PreparedStatement, RunResult } from './connection';

class SQLitePreparedStatement implements PreparedStatement {
  constructor(private stmt: Database.Statement) {}

  run(...params: any[]): RunResult {
    const result = this.stmt.run(...params);
    return {
      changes: result.changes,
      lastID: result.lastInsertRowid,
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  get(...params: any[]): any {
    return this.stmt.get(...params);
  }

  all(...params: any[]): any[] {
    return this.stmt.all(...params);
  }
}

export class SQLiteConnection implements DatabaseConnection {
  type: 'sqlite' = 'sqlite';
  private db!: Database.Database;

  constructor() {
    // Initialiser immédiatement dans le constructeur pour SQLite
    const dbPath = process.env.DATABASE_PATH || './data/nocalculator.db';
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    console.log(`📁 SQLite connecté: ${dbPath}`);
  }

  async connect(): Promise<void> {
    // SQLite est déjà connecté dans le constructeur
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string): PreparedStatement {
    return new SQLitePreparedStatement(this.db.prepare(sql));
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
