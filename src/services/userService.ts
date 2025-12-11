import { getConnection } from '../db/database';
import { User } from '../types';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class UserService {
  static async create(username: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const db = getConnection();
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
    `);
    
    const result = stmt.run(username, passwordHash);
    
    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): User | undefined {
    const db = getConnection();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static findByUsername(username: string): User | undefined {
    const db = getConnection();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | undefined;
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static updateElo(userId: number, newElo: number): void {
    const db = getConnection();
    const stmt = db.prepare('UPDATE users SET elo = ? WHERE id = ?');
    stmt.run(newElo, userId);
  }

  static incrementGamesPlayed(userId: number): void {
    const db = getConnection();
    const stmt = db.prepare('UPDATE users SET games_played = games_played + 1 WHERE id = ?');
    stmt.run(userId);
  }

  static incrementGamesWon(userId: number): void {
    const db = getConnection();
    const stmt = db.prepare('UPDATE users SET games_won = games_won + 1 WHERE id = ?');
    stmt.run(userId);
  }

  static getLeaderboard(limit: number = 50): User[] {
    const db = getConnection();
    const stmt = db.prepare(`
      SELECT id, username, elo, games_played, games_won
      FROM users
      ORDER BY elo DESC
      LIMIT ?
    `);
    return stmt.all(limit) as User[];
  }
}
