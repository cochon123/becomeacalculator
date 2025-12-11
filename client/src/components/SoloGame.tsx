import { useState, useEffect, useRef, FormEvent } from 'react';
import { audioService } from '../services/audioService';
import type { Question } from '../services/socket';

interface SoloGameProps {
  matchData: {
    matchId: string;
    questions: Question[];
    isSolo: boolean;
  };
  onGameEnd: () => void;
}

export default function SoloGame({ matchData, onGameEnd }: SoloGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [totalTime, setTotalTime] = useState(0);
  const [startTime] = useState(Date.now());

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentQuestionIndex]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    const timeMs = Date.now() - questionStartTime;
    const numAnswer = parseInt(answer, 10);
    const currentQuestion = matchData.questions[currentQuestionIndex];
    const isCorrect = numAnswer === currentQuestion.answer;

    // Feedback visuel et sonore
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      audioService.playCorrectAnswer();
    } else {
      audioService.playIncorrectAnswer();
    }

    if (isCorrect) {
      // Score basé sur la vitesse (max 100 points, min 10 points)
      const timeBonus = Math.max(10, Math.floor(100 - timeMs / 100));
      setScore((prev) => prev + timeBonus);
      setCorrectAnswers((prev) => prev + 1);
    } else {
      // Pénalité pour mauvaise réponse: -50 points (minimum 0)
      setScore((prev) => Math.max(0, prev - 50));
    }

    // Passer à la question suivante après un court délai
    setTimeout(() => {
      setFeedback(null);
      setAnswer('');
      
      if (currentQuestionIndex + 1 >= matchData.questions.length) {
        setTotalTime(Date.now() - startTime);
        setGameFinished(true);
        audioService.playGameOver();
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setQuestionStartTime(Date.now());
      }
    }, 400);
  };

  const currentQuestion = matchData.questions[currentQuestionIndex];

  if (gameFinished) {
    const accuracy = Math.round((correctAnswers / matchData.questions.length) * 100);
    const avgTimePerQuestion = Math.round(totalTime / matchData.questions.length / 1000 * 10) / 10;

    return (
      <div className="app-container animate-fade-in">
        <div className="card text-center" style={{ maxWidth: '600px', width: '100%' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>🏆 Test Terminé!</h1>
          
          <div style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Score</div>
              <div style={{ fontSize: '2rem', color: 'var(--accent-color)' }}>{score}</div>
            </div>
            <div className="card" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Précision</div>
              <div style={{ fontSize: '2rem', color: 'var(--success-color)' }}>{accuracy}%</div>
            </div>
            <div className="card" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Bonnes réponses</div>
              <div style={{ fontSize: '2rem' }}>{correctAnswers}/{matchData.questions.length}</div>
            </div>
            <div className="card" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Temps moyen</div>
              <div style={{ fontSize: '2rem' }}>{avgTimePerQuestion}s</div>
            </div>
          </div>

          <button
            onClick={onGameEnd}
            className="btn btn-primary"
            style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
          >
            Retour au Lobby
          </button>
        </div>
      </div>
    );
  }

  const getOperatorSymbol = (op: string) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
      <div className="game-container">
        {/* Header */}
        <div className="score-board" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="player-card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Question</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentQuestionIndex + 1}/{matchData.questions.length}</div>
          </div>
          <div className="player-card active">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Score</div>
            <div className="score-value">{score}</div>
          </div>
          <div className="player-card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Correct</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{correctAnswers}</div>
          </div>
        </div>

        {/* Question */}
        <div className="question-card animate-slide-in">
          {feedback && (
            <div className={`feedback-overlay ${feedback === 'correct' ? 'feedback-correct' : 'feedback-incorrect'}`}>
              {feedback === 'correct' ? '✓' : '✗'}
            </div>
          )}

          <div className="question-text mb-4">
            {currentQuestion.a} {getOperatorSymbol(currentQuestion.op)} {currentQuestion.b}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="?"
              autoFocus
              disabled={feedback !== null}
              className="input-field answer-input"
            />
            <button
              type="submit"
              disabled={feedback !== null}
              className="btn btn-primary mt-4 w-full"
              style={{ fontSize: '1.5rem' }}
            >
              Valider
            </button>
          </form>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginTop: '2rem'
        }}>
          <div style={{
            width: `${((currentQuestionIndex) / matchData.questions.length) * 100}%`,
            height: '100%',
            backgroundColor: 'var(--accent-color)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  );
}
