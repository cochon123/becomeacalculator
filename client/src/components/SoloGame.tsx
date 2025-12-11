import { useState, useEffect, useRef, FormEvent } from 'react';
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

    // Feedback visuel
    setFeedback(isCorrect ? 'correct' : 'incorrect');

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
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          color: 'white',
        }}
      >
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🏆 Test Terminé!</h1>
        
        <div style={{ fontSize: '24px', marginBottom: '30px', textAlign: 'center' }}>
          <p>Score: <strong>{score}</strong> points</p>
          <p>Bonnes réponses: <strong>{correctAnswers}</strong> / {matchData.questions.length}</p>
          <p>Précision: <strong>{accuracy}%</strong></p>
          <p>Temps moyen: <strong>{avgTimePerQuestion}s</strong> par question</p>
        </div>

        <button
          onClick={onGameEnd}
          style={{
            padding: '15px 40px',
            fontSize: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Retour au Lobby
        </button>
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
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: feedback === 'correct' ? '#1b4332' : feedback === 'incorrect' ? '#5c1a1a' : '#1a1a2e',
        color: 'white',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        gap: '50px',
        fontSize: '20px'
      }}>
        <div>
          <span>Question: </span>
          <strong>{currentQuestionIndex + 1}</strong>/{matchData.questions.length}
        </div>
        <div>
          <span>Score: </span>
          <strong>{score}</strong>
        </div>
        <div>
          <span>✓ </span>
          <strong>{correctAnswers}</strong>
        </div>
      </div>

      {/* Question */}
      <div style={{ fontSize: '72px', marginBottom: '40px', fontWeight: 'bold' }}>
        {currentQuestion.a} {getOperatorSymbol(currentQuestion.op)} {currentQuestion.b} = ?
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          ref={inputRef}
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Réponse"
          autoFocus
          disabled={feedback !== null}
          style={{
            fontSize: '36px',
            padding: '15px 20px',
            width: '200px',
            textAlign: 'center',
            borderRadius: '8px',
            border: '2px solid #333',
            backgroundColor: '#2a2a4a',
            color: 'white',
          }}
        />
        <button
          type="submit"
          disabled={feedback !== null}
          style={{
            padding: '15px 30px',
            fontSize: '24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: feedback !== null ? 'not-allowed' : 'pointer',
            opacity: feedback !== null ? 0.7 : 1,
          }}
        >
          ✓
        </button>
      </form>

      {/* Feedback */}
      {feedback && (
        <div style={{ 
          marginTop: '30px', 
          fontSize: '32px',
          animation: 'fadeIn 0.2s ease'
        }}>
          {feedback === 'correct' ? '✅ Correct!' : `❌ Faux! (${currentQuestion.answer})`}
        </div>
      )}

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        width: '80%',
        maxWidth: '600px',
        height: '10px',
        backgroundColor: '#333',
        borderRadius: '5px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${((currentQuestionIndex) / matchData.questions.length) * 100}%`,
          height: '100%',
          backgroundColor: '#4CAF50',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}
