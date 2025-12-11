import { getConnection } from '../db/database';
import { Match, Question } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class MatchService {
  static create(player1Id: number, player2Id: number, questions: Question[]): Match {
    const matchId = uuidv4();
    const questionsJson = JSON.stringify(questions);
    const db = getConnection();

    const stmt = db.prepare(`
      INSERT INTO matches (id, player1_id, player2_id, questions, status)
      VALUES (?, ?, ?, ?, 'waiting')
    `);

    stmt.run(matchId, player1Id, player2Id, questionsJson);

    return this.findById(matchId)!;
  }

  static findById(id: string): Match | undefined {
    const db = getConnection();
    const stmt = db.prepare('SELECT * FROM matches WHERE id = ?');
    return stmt.get(id) as Match | undefined;
  }

  static updateStatus(matchId: string, status: 'waiting' | 'in_progress' | 'finished'): void {
    const db = getConnection();
    const stmt = db.prepare('UPDATE matches SET status = ? WHERE id = ?');
    stmt.run(status, matchId);
  }

  static updateScore(matchId: string, playerId: number, score: number): void {
    const match = this.findById(matchId);
    if (!match) return;

    const db = getConnection();
    const column = match.player1_id === playerId ? 'player1_score' : 'player2_score';
    const stmt = db.prepare(`UPDATE matches SET ${column} = ? WHERE id = ?`);
    stmt.run(score, matchId);
  }

  static finishMatch(matchId: string, winnerId: number | null): void {
    const db = getConnection();
    const stmt = db.prepare(`
      UPDATE matches 
      SET status = 'finished', winner_id = ?, finished_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(winnerId, matchId);
  }

  static recordEvent(
    matchId: string,
    playerId: number,
    questionIndex: number,
    answer: number,
    correct: boolean,
    timeMs: number
  ): void {
    const db = getConnection();
    const stmt = db.prepare(`
      INSERT INTO match_events (match_id, player_id, question_index, answer, correct, time_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(matchId, playerId, questionIndex, answer, correct ? 1 : 0, timeMs);
  }
}
