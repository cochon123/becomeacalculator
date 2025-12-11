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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          color: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0 }}>🏆 Leaderboard</h1>
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
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>⏳ Chargement du leaderboard...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ff6b6b' }}>
            <p>❌ {error}</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && entries.length > 0 && (
          <div>
            {/* Desktop Table */}
            <div style={{ display: 'none' }} className="desktop-view">
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '20px',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid #4CAF50' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Rang</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Joueur</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>ELO</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Matchs</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Victoires</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const isCurrentUser = entry.id === currentUserId;
                    return (
                      <tr
                        key={entry.id}
                        style={{
                          backgroundColor: isCurrentUser ? 'rgba(76, 175, 80, 0.2)' : index % 2 === 0 ? '#2a2a4a' : '#1a1a2e',
                          borderBottom: '1px solid #333',
                        }}
                      >
                        <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '18px' }}>
                          {getMedalEmoji(index + 1)} #{index + 1}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {entry.username}
                          {isCurrentUser && ' (toi)'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#4CAF50' }}>
                          {entry.elo}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{entry.games_played}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{entry.games_won}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>\n                          {getWinRate(entry.win_rate)}\n                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div style={{ display: 'block' }}>
              {entries.map((entry, index) => {
                const isCurrentUser = entry.id === currentUserId;
                return (
                  <div
                    key={entry.id}
                    style={{
                      backgroundColor: isCurrentUser ? 'rgba(76, 175, 80, 0.2)' : '#2a2a4a',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '10px',
                      border: isCurrentUser ? '2px solid #4CAF50' : '1px solid #333',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {getMedalEmoji(index + 1)} #{index + 1} {entry.username}
                          {isCurrentUser && ' 👈'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                          {entry.games_played} matchs • {entry.games_won} victoires ({getWinRate(entry.win_rate)})
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: '#4CAF50',
                          textAlign: 'right',
                        }}
                      >
                        {entry.elo}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            <p>📭 Aucun joueur pour l'instant</p>
          </div>
        )}
      </div>
    </div>
  );
}
