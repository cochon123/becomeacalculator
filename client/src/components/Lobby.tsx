import { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import { audioService } from '../services/audioService';
import Leaderboard from './Leaderboard';

interface LobbyProps {
  user: any;
  onMatchFound: (matchData: any) => void;
  onLogout: () => void;
}

export default function Lobby({ user, onMatchFound, onLogout }: LobbyProps) {
  const [inQueue, setInQueue] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(audioService.isSoundsEnabled());
  const [volume, setVolume] = useState(audioService.getVolume());


  useEffect(() => {
    socketService.onQueueJoined((data) => {
      setQueueSize(data.queueSize);
    });

    socketService.onMatchFound((data) => {
      setInQueue(false);
      onMatchFound(data);
    });

    return () => {
      socketService.off('queue_joined');
      socketService.off('match_found');
    };
  }, [onMatchFound]);

  const handleJoinQueue = () => {
    setInQueue(true);
    socketService.joinQueue();
  };

  const handleLeaveQueue = () => {
    setInQueue(false);
    socketService.leaveQueue();
  };

  const handleSoloTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/solo', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du démarrage du test solo');
      }
      
      const data = await response.json();
      onMatchFound(data);
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showLeaderboard) {
    return <Leaderboard onClose={() => setShowLeaderboard(false)} currentUserId={user.id} />;
  }

  return (
    <div className="app-container">
      <div className="card animate-fade-in" style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>👋 {user.username}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>ELO: <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{user.elo}</span></p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 'var(--border-radius)' }}>
              <button
                onClick={() => {
                  const newState = audioService.toggleSounds();
                  setSoundsEnabled(newState);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: soundsEnabled ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
                title={soundsEnabled ? 'Désactiver les sons' : 'Activer les sons'}
              >
                {soundsEnabled ? '🔊' : '🔇'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  audioService.setVolume(newVolume);
                }}
                disabled={!soundsEnabled}
                style={{ width: '80px', cursor: soundsEnabled ? 'pointer' : 'not-allowed', opacity: soundsEnabled ? 1 : 0.5 }}
                title="Volume"
              />
            </div>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="btn btn-secondary"
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={onLogout}
              className="btn btn-danger"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="logo-text">🎮 Lobby</h1>
          
          {!inQueue ? (
            <div className="animate-slide-in">
              <button
                onClick={handleJoinQueue}
                className="btn btn-primary"
                style={{ fontSize: '1.2rem', padding: '1rem 2rem', width: '100%', maxWidth: '400px', marginBottom: '1rem' }}
              >
                🚀 Trouver un match
              </button>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSoloTest}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{ flex: '1 1 200px' }}
                >
                  🧪 {loading ? 'Chargement...' : 'Mode Test Solo'}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
                ⏳ Recherche d'un adversaire...
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>Joueurs en file: {queueSize}</p>
              <button
                onClick={handleLeaveQueue}
                className="btn btn-secondary mt-4"
              >
                Annuler
              </button>
            </div>
          )}

          <div className="card mt-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)', textAlign: 'left' }}>
            <h3 className="mb-4" style={{ color: 'var(--accent-color)' }}>📋 Comment jouer ?</h3>
            <ul style={{ lineHeight: '1.8', listStylePosition: 'inside' }}>
              <li>Résous des calculs mentaux le plus vite possible</li>
              <li>Affronte un adversaire de niveau similaire (ELO)</li>
              <li>La difficulté augmente au fil des questions</li>
              <li style={{ color: 'var(--success-color)' }}>✅ Bonne réponse : <strong>+1 point</strong></li>
              <li style={{ color: 'var(--error-color)' }}>❌ Mauvaise réponse : <strong>-1 point</strong></li>
              <li>⚡ Le premier à finir termine la partie pour les deux</li>
              <li>🏆 En cas d'égalité, le plus rapide gagne !</li>
              <li style={{ marginTop: '10px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                💡 Utilise le mode test solo pour t'entraîner
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
