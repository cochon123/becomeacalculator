import { io, Socket } from 'socket.io-client';

// Détecte automatiquement l'hôte (fonctionne sur localhost et réseau local)
const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  // Utilise le même hôte que la page actuelle, port 3001
  const host = window.location.hostname;
  return `http://${host}:3001`;
};

const WS_URL = getWsUrl();

// Types exportés explicitement pour compatibilité Vite/rolldown
interface IQuestion {
  op: '+' | '-' | '*' | '/';
  a: number;
  b: number;
  answer: number;
}

interface IMatchFoundEvent {
  matchId: string;
  opponent: { id: number; username: string };
  questions: IQuestion[];
}

interface IAnswerSubmittedEvent {
  playerId: number;
  questionIndex: number;
  correct: boolean;
  newScore: number;
  currentQuestion: number;
}

interface IMatchFinishedEvent {
  winnerId: number | null;
  finalScores: {
    player1: number;
    player2: number;
  };
}

// Re-export avec type
export type Question = IQuestion;
export type MatchFoundEvent = IMatchFoundEvent;
export type AnswerSubmittedEvent = IAnswerSubmittedEvent;
export type MatchFinishedEvent = IMatchFinishedEvent;

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('✅ Connecté au serveur WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion:', error.message);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinQueue() {
    this.socket?.emit('join_queue');
  }

  leaveQueue() {
    this.socket?.emit('leave_queue');
  }

  joinMatch(matchId: string) {
    this.socket?.emit('join_match', matchId);
  }

  submitAnswer(matchId: string, questionIndex: number, answer: number, timeMs: number) {
    this.socket?.emit('submit_answer', { matchId, questionIndex, answer, timeMs });
  }

  onQueueJoined(callback: (data: { queueSize: number }) => void) {
    this.socket?.on('queue_joined', callback);
  }

  onMatchFound(callback: (data: IMatchFoundEvent) => void) {
    this.socket?.on('match_found', callback);
  }

  onAnswerSubmitted(callback: (data: IAnswerSubmittedEvent) => void) {
    this.socket?.on('answer_submitted', callback);
  }

  onMatchFinished(callback: (data: IMatchFinishedEvent) => void) {
    this.socket?.on('match_finished', callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
