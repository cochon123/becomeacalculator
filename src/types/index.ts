export interface User {
  id: number;
  username: string;
  password_hash: string;
  elo: number;
  games_played: number;
  games_won: number;
  created_at: string;
}

export interface Question {
  op: '+' | '-' | '*' | '/';
  a: number;
  b: number;
  answer: number;
}

export interface Match {
  id: string;
  player1_id: number;
  player2_id: number;
  questions: string; // JSON stringified Question[]
  player1_score: number;
  player2_score: number;
  winner_id: number | null;
  status: 'waiting' | 'in_progress' | 'finished';
  created_at: string;
  finished_at: string | null;
}

export interface MatchEvent {
  id: number;
  match_id: string;
  player_id: number;
  question_index: number;
  answer: number;
  correct: boolean;
  time_ms: number;
  created_at: string;
}

export interface MatchState {
  matchId: string;
  player1: { id: number; username: string; score: number; currentQuestion: number };
  player2: { id: number; username: string; score: number; currentQuestion: number };
  questions: Question[];
  status: 'waiting' | 'in_progress' | 'finished';
  winner?: number;
}
