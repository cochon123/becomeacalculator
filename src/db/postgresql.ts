import { Pool, QueryResult } from 'pg';
import { DatabaseConnection, PreparedStatement, RunResult } from './connection';

class PostgreSQLPreparedStatement implements PreparedStatement {
  constructor(private pool: Pool, private sql: string) {}

  run(...params: any[]): RunResult {
    // Pour PostgreSQL, il faut utiliser query() qui est async
    // Mais cette interface est sync. À adapter au besoin.
    throw new Error('Use runAsync() for PostgreSQL');
  }

  get(...params: any[]): any {
    throw new Error('Use getAsync() for PostgreSQL');
  }

  all(...params: any[]): any[] {
    throw new Error('Use allAsync() for PostgreSQL');
  }

  // Méthodes async pour PostgreSQL
  async runAsync(...params: any[]): Promise<RunResult> {
    const result = await this.pool.query(this.sql, params);
    return {
      changes: result.rowCount || 0,
      lastID: result.rows[0]?.id || undefined,
    };
  }

  async getAsync(...params: any[]): Promise<any> {
    const result = await this.pool.query(this.sql, params);
    return result.rows[0];
  }

  async allAsync(...params: any[]): Promise<any[]> {
    const result = await this.pool.query(this.sql, params);
    return result.rows;
  }
}

export class PostgreSQLConnection implements DatabaseConnection {
  type: 'postgresql' = 'postgresql';
  private pool!: Pool;

  async connect(): Promise<void> {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL env var not set for PostgreSQL');
    }

    this.pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });

    // Test connection
    const client = await this.pool.connect();
    client.release();
    console.log(`🐘 PostgreSQL connecté: ${connectionString.split('@')[1]}`);
  }

  exec(sql: string): void {
    throw new Error('exec() not supported for PostgreSQL. Use query() instead');
  }

  prepare(sql: string): PostgreSQLPreparedStatement {
    return new PostgreSQLPreparedStatement(this.pool, sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Exécuter une requête simple (pour init)
   */
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    return this.pool.query(sql, params);
  }
}
