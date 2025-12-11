import { useState, useEffect, useRef, FormEvent } from 'react';
import { socketService } from '../services/socket';
import { audioService } from '../services/audioService';
import type { Question, AnswerSubmittedEvent, MatchFinishedEvent } from '../services/socket';

interface GameProps {
  matchData: {
    matchId: string;
    opponent: { id: number; username: string };
    questions: Question[];
  };
  userId: number;
  onGameEnd: () => void;
}

export default function Game({ matchData, userId, onGameEnd }: GameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    socketService.joinMatch(matchData.matchId);
    setQuestionStartTime(Date.now());

    socketService.onAnswerSubmitted((data: AnswerSubmittedEvent) => {
      if (data.playerId === userId) {
        setMyScore(data.newScore);
        setCurrentQuestionIndex(data.currentQuestion);
        
        // Feedback visuel et sonore
        setFeedback(data.correct ? 'correct' : 'incorrect');
        if (data.correct) {
          audioService.playCorrectAnswer();
        } else {
          audioService.playIncorrectAnswer();
        }
        setTimeout(() => setFeedback(null), 600);
        setQuestionStartTime(Date.now());
      } else {
        setOpponentScore(data.newScore);
      }
    });

    socketService.onMatchFinished((data: MatchFinishedEvent) => {
      setGameFinished(true);
      setWinner(data.winnerId);
      // Play sound based on game result
      if (data.winnerId === userId) {
        audioService.playWinner();
      } else if (data.winnerId !== null) {
        audioService.playGameOver();
      } else {
        audioService.playGameOver();
      }
    });

    return () => {
      socketService.off('answer_submitted');
      socketService.off('match_finished');
    };
  }, [matchData.matchId, userId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentQuestionIndex]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    const timeMs = Date.now() - questionStartTime;
    const numAnswer = parseInt(answer, 10);

    socketService.submitAnswer(matchData.matchId, currentQuestionIndex, numAnswer, timeMs);
    setAnswer('');
  };

  const currentQuestion = matchData.questions[currentQuestionIndex];

  if (gameFinished) {
    const iWon = winner === userId;
    const isDraw = winner === null;

    return (
      <div className="app-container animate-fade-in" style={{ backgroundColor: isDraw ? 'var(--warning-color)' : iWon ? 'var(--success-color)' : 'var(--error-color)' }}>
        <div className="card text-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', border: 'none' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {isDraw ? '🤝 Égalité !' : iWon ? '🎉 Victoire !' : '😔 Défaite'}
          </h1>
          <div style={{ fontSize: '2rem', marginBottom: '2rem' }}>
            <p>Ton score: <strong>{myScore}</strong></p>
            <p>Score de {matchData.opponent.username}: <strong>{opponentScore}</strong></p>
          </div>
          <button
            onClick={onGameEnd}
            className="btn"
            style={{ backgroundColor: 'white', color: 'black', fontSize: '1.2rem', padding: '1rem 2rem' }}
          >
            Retour au lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
      <div className="game-container">
        {/* Header avec scores */}
        <div className="score-board">
          <div className="player-card active">
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Toi</div>
            <div className="score-value">{myScore}</div>
          </div>
          <div className="player-card">
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{matchData.opponent.username}</div>
            <div className="score-value" style={{ color: 'var(--text-secondary)' }}>{opponentScore}</div>
          </div>
        </div>

        <div className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
          Question {currentQuestionIndex + 1} / {matchData.questions.length}
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="question-card animate-slide-in">
            {feedback && (
              <div className={`feedback-overlay ${feedback === 'correct' ? 'feedback-correct' : 'feedback-incorrect'}`}>
                {feedback === 'correct' ? '✓' : '✗'}
              </div>
            )}
            
            <div className="question-text mb-4">
              {currentQuestion.a} {currentQuestion.op === '*' ? '×' : currentQuestion.op === '/' ? '÷' : currentQuestion.op} {currentQuestion.b}
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="?"
                className="input-field answer-input"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary mt-4 w-full"
                style={{ fontSize: '1.5rem' }}
              >
                Valider
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
