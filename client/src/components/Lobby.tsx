import { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
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
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2>👋 {user.username}</h2>
          <p>ELO: {user.elo}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowLeaderboard(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h1>🎮 Lobby</h1>
        
        {!inQueue ? (
          <>
            <button
              onClick={handleJoinQueue}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '30px',
              }}
            >
              🚀 Trouver un match
            </button>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleSoloTest}
                disabled={loading}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                🧪 {loading ? 'Chargement...' : 'Mode Test Solo'}
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                🏆 Voir le Leaderboard
              </button>
            </div>
          </>
        ) : (
          <div style={{ marginTop: '30px' }}>
            <p style={{ fontSize: '18px' }}>⏳ Recherche d'un adversaire...</p>
            <p>Joueurs en file: {queueSize}</p>
            <button
              onClick={handleLeaveQueue}
              style={{
                padding: '10px 20px',
                marginTop: '20px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        )}

        <div style={{ marginTop: '50px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>📋 Comment jouer ?</h3>
          <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li>Résous des calculs mentaux le plus vite possible</li>
            <li>Affronte un adversaire de niveau similaire (ELO)</li>
            <li>La difficulté augmente au fil des questions</li>
            <li style={{ color: '#4CAF50' }}>✅ Bonne réponse : <strong>+1 point</strong></li>
            <li style={{ color: '#f44336' }}>❌ Mauvaise réponse : <strong>-1 point</strong></li>
            <li>⚡ Le premier à finir termine la partie pour les deux</li>
            <li>🏆 En cas d'égalité, le plus rapide gagne !</li>
            <li style={{ marginTop: '10px', fontStyle: 'italic', color: '#666' }}>
              💡 Utilise le mode test solo pour t'entraîner
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
