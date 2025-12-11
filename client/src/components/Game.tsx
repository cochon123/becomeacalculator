import { useState, useEffect, useRef, FormEvent } from 'react';
import { socketService } from '../services/socket';
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
        
        // Feedback visuel
        setFeedback(data.correct ? 'correct' : 'incorrect');
        setTimeout(() => setFeedback(null), 600);
        setQuestionStartTime(Date.now());
      } else {
        setOpponentScore(data.newScore);
      }
    });

    socketService.onMatchFinished((data: MatchFinishedEvent) => {
      setGameFinished(true);
      setWinner(data.winnerId);
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
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDraw ? '#FFC107' : iWon ? '#4CAF50' : '#f44336',
          color: 'white',
          textAlign: 'center',
          transition: 'background-color 0.5s',
        }}
      >
        <h1 style={{ fontSize: '60px', marginBottom: '20px' }}>
          {isDraw ? '🤝 Égalité !' : iWon ? '🎉 Victoire !' : '😔 Défaite'}
        </h1>
        <div style={{ fontSize: '30px', marginBottom: '40px' }}>
          <p>Ton score: {myScore}</p>
          <p>Score de {matchData.opponent.username}: {opponentScore}</p>
        </div>
        <button
          onClick={onGameEnd}
          style={{
            padding: '15px 40px',
            fontSize: '20px',
            backgroundColor: 'white',
            color: '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Retour au lobby
        </button>
      </div>
    );
  }

  const bgColor = feedback === 'correct' ? '#4CAF50' : feedback === 'incorrect' ? '#f44336' : 'white';

  return (
    <div
      style={{
        height: '100vh',
        backgroundColor: bgColor,
        transition: 'background-color 0.3s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header avec scores */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px',
          backgroundColor: 'rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <strong>Toi</strong>
          <div style={{ fontSize: '24px' }}>⭐ {myScore}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div>Question {currentQuestionIndex + 1}/{matchData.questions.length}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong>{matchData.opponent.username}</strong>
          <div style={{ fontSize: '24px' }}>⭐ {opponentScore}</div>
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {currentQuestion && (
          <>
            <div style={{ fontSize: '80px', fontWeight: 'bold', marginBottom: '40px' }}>
              {currentQuestion.a} {currentQuestion.op} {currentQuestion.b} = ?
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input
                ref={inputRef}
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Réponse"
                style={{
                  padding: '15px',
                  fontSize: '30px',
                  width: '200px',
                  textAlign: 'center',
                  border: '2px solid #ccc',
                  borderRadius: '8px',
                }}
                autoFocus
              />
              <button
                type="submit"
                style={{
                  padding: '15px 30px',
                  fontSize: '30px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                ✓
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
