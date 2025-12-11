/**
 * Database module - Supports both SQLite and PostgreSQL
 * 
 * Usage:
 *   - Development: DATABASE_TYPE=sqlite (default)
 *   - Production: DATABASE_TYPE=postgresql with DATABASE_URL set
 */

export { createConnection, getConnection, closeConnection } from './connection';
export type { DatabaseConnection, PreparedStatement } from './connection';
export { initDatabase } from './schema';
export { runMigrations, resetDatabase } from './migrations';
