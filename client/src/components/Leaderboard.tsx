import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: number;
  username: string;
  elo: number;
  games_played: number;
  games_won: number;
  win_rate: string;
}

interface LeaderboardProps {
  onClose: () => void;
  currentUserId: number;
}

export default function Leaderboard({ onClose, currentUserId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard?limit=100', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du leaderboard');
        }
        
        const data = await response.json();
        setEntries(data.leaderboard || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getWinRate = (rate: string): string => {
    if (!rate || rate === 'NaN' || rate === 'NaN%') return '0%';
    return rate.endsWith('%') ? rate : `${rate}%`;
  };

  const getMedalEmoji = (position: number): string => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '  ';
  };

  return (
    <div className="leaderboard-modal" onClick={onClose}>
      <div className="leaderboard-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="leaderboard-header">
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🏆 Leaderboard</h1>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center" style={{ padding: '40px' }}>
            <p style={{ animation: 'pulse 1.5s infinite' }}>⏳ Chargement du leaderboard...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center" style={{ padding: '40px', color: 'var(--error-color)' }}>
            <p>❌ {error}</p>
          </div>
        )}

        {/* Leaderboard List */}
        {!loading && !error && entries.length > 0 && (
          <div className="leaderboard-list">
            {entries.map((entry, index) => {
              const isCurrentUser = entry.id === currentUserId;
              return (
                <div
                  key={entry.id}
                  className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}
                >
                  <div className={`rank-badge rank-${index + 1}`} style={{ color: index < 3 ? 'black' : 'var(--text-primary)', background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--bg-card)' }}>
                    {index + 1}
                  </div>
                  <div style={{ fontWeight: 'bold', paddingLeft: '10px' }}>
                    {entry.username}
                    {isCurrentUser && <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.8rem', marginLeft: '5px' }}>(toi)</span>}
                  </div>
                  <div className="text-center hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {entry.games_won}W / {entry.games_played}G ({getWinRate(entry.win_rate)})
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '1.2rem' }}>
                    {entry.elo}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <div className="text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
            <p>📭 Aucun joueur pour l'instant</p>
          </div>
        )}
      </div>
    </div>
  );
}
