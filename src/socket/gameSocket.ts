import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../middleware/auth';
import { matchmakingQueue } from '../services/matchmakingService';
import { MatchService } from '../services/matchService';
import { UserService } from '../services/userService';
import { generateQuestions, validateAnswer } from '../services/questionService';
import { updatePlayerElos, updatePlayerEloDraw } from '../services/eloService';
import { MatchState, Question } from '../types';

interface SocketData {
  userId: number;
  username: string;
}

// Stockage en mémoire de l'état des matchs actifs
const activeMatches = new Map<string, MatchState>();
const playerToMatch = new Map<number, string>();
// Stocker qui a fini en premier pour le tie-breaker
const firstFinisher = new Map<string, number>();

export function initializeWebSocket(server: HttpServer): SocketServer {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Middleware d'authentification
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Non authentifié'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Token invalide'));
    }

    (socket.data as SocketData) = {
      userId: payload.userId,
      username: payload.username,
    };

    next();
  });

  io.on('connection', (socket: Socket) => {
    const { userId, username } = socket.data as SocketData;
    console.log(`✅ ${username} (${userId}) connecté`);

    // Rejoindre la queue de matchmaking
    socket.on('join_queue', () => {
      const user = UserService.findById(userId);
      if (!user) return;

      matchmakingQueue.addPlayer(userId, username, user.elo);
      socket.emit('queue_joined', { queueSize: matchmakingQueue.getQueueSize() });

      // Tenter de trouver un match
      const match = matchmakingQueue.findMatch(userId);
      if (match) {
        // Match trouvé !
        const questions = generateQuestions(`${match.player1.userId}-${match.player2.userId}-${Date.now()}`, 20);
        const dbMatch = MatchService.create(match.player1.userId, match.player2.userId, questions);

        const matchState: MatchState = {
          matchId: dbMatch.id,
          player1: { id: match.player1.userId, username: match.player1.username, score: 0, currentQuestion: 0 },
          player2: { id: match.player2.userId, username: match.player2.username, score: 0, currentQuestion: 0 },
          questions,
          status: 'in_progress',
        };

        activeMatches.set(dbMatch.id, matchState);
        playerToMatch.set(match.player1.userId, dbMatch.id);
        playerToMatch.set(match.player2.userId, dbMatch.id);

        MatchService.updateStatus(dbMatch.id, 'in_progress');

        // Notifier les deux joueurs
        io.to(`user-${match.player1.userId}`).emit('match_found', {
          matchId: dbMatch.id,
          opponent: { id: match.player2.userId, username: match.player2.username },
          questions,
        });

        io.to(`user-${match.player2.userId}`).emit('match_found', {
          matchId: dbMatch.id,
          opponent: { id: match.player1.userId, username: match.player1.username },
          questions,
        });
      }
    });

    // Quitter la queue
    socket.on('leave_queue', () => {
      matchmakingQueue.removePlayer(userId);
      socket.emit('queue_left');
    });

    // Rejoindre une room de match
    socket.on('join_match', (matchId: string) => {
      socket.join(`match-${matchId}`);
      const matchState = activeMatches.get(matchId);
      if (matchState) {
        socket.emit('match_state', matchState);
      }
    });

    // Soumettre une réponse
    socket.on('submit_answer', (data: { matchId: string; questionIndex: number; answer: number; timeMs: number }) => {
      const matchState = activeMatches.get(data.matchId);
      if (!matchState || matchState.status !== 'in_progress') return;

      const question = matchState.questions[data.questionIndex];
      if (!question) return;

      const correct = validateAnswer(question, data.answer);
      const isPlayer1 = matchState.player1.id === userId;
      const player = isPlayer1 ? matchState.player1 : matchState.player2;

      // Mettre à jour le score: +1 si correct, -1 si incorrect (minimum 0)
      if (correct) {
        player.score += 1;
      } else {
        player.score = Math.max(0, player.score - 1);
      }
      MatchService.updateScore(data.matchId, userId, player.score);

      player.currentQuestion = data.questionIndex + 1;

      // Enregistrer l'événement
      MatchService.recordEvent(data.matchId, userId, data.questionIndex, data.answer, correct, data.timeMs);

      // Notifier les deux joueurs
      io.to(`match-${data.matchId}`).emit('answer_submitted', {
        playerId: userId,
        questionIndex: data.questionIndex,
        correct,
        newScore: player.score,
        currentQuestion: player.currentQuestion,
      });

      // Vérifier si ce joueur a fini toutes les questions
      const totalQuestions = matchState.questions.length;
      if (player.currentQuestion >= totalQuestions) {
        // Enregistrer qui a fini en premier (tie-breaker)
        if (!firstFinisher.has(data.matchId)) {
          firstFinisher.set(data.matchId, userId);
        }
        // Terminer le match dès que le premier joueur finit
        finishMatch(data.matchId, matchState, io);
      }
    });

    // Rejoindre une room utilisateur
    socket.join(`user-${userId}`);

    socket.on('disconnect', () => {
      console.log(`❌ ${username} (${userId}) déconnecté`);
      matchmakingQueue.removePlayer(userId);
    });
  });

  return io;
}

function finishMatch(matchId: string, matchState: MatchState, io: SocketServer): void {
  matchState.status = 'finished';

  const score1 = matchState.player1.score;
  const score2 = matchState.player2.score;

  let winnerId: number | null = null;

  if (score1 > score2) {
    winnerId = matchState.player1.id;
    updatePlayerElos(matchState.player1.id, matchState.player2.id);
  } else if (score2 > score1) {
    winnerId = matchState.player2.id;
    updatePlayerElos(matchState.player2.id, matchState.player1.id);
  } else {
    // Égalité de score: celui qui a fini en premier gagne
    const firstToFinish = firstFinisher.get(matchId);
    if (firstToFinish) {
      winnerId = firstToFinish;
      if (winnerId === matchState.player1.id) {
        updatePlayerElos(matchState.player1.id, matchState.player2.id);
      } else {
        updatePlayerElos(matchState.player2.id, matchState.player1.id);
      }
    } else {
      // Cas improbable: vraie égalité
      updatePlayerEloDraw(matchState.player1.id, matchState.player2.id);
    }
  }

  matchState.winner = winnerId || undefined;
  MatchService.finishMatch(matchId, winnerId);

  // Notifier les deux joueurs
  io.to(`match-${matchId}`).emit('match_finished', {
    winnerId,
    finalScores: {
      player1: score1,
      player2: score2,
    },
    firstToFinish: firstFinisher.get(matchId),
  });

  // Nettoyer
  activeMatches.delete(matchId);
  playerToMatch.delete(matchState.player1.id);
  playerToMatch.delete(matchState.player2.id);
  firstFinisher.delete(matchId);
}
