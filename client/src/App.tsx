import { useState, useEffect } from 'react';
import Login from './components/Login';
import Lobby from './components/Lobby';
import Game from './components/Game';
import SoloGame from './components/SoloGame';
import { socketService } from './services/socket';
import { authService } from './services/api';

type Screen = 'login' | 'lobby' | 'game' | 'solo';

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    // Vérifier si déjà connecté
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      authService.me().then((userData) => {
        if (userData) {
          setUser(userData);
          setToken(storedToken);
          socketService.connect(storedToken);
          setScreen('lobby');
        }
      });
    }
  }, []);

  const handleLogin = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    socketService.connect(userToken);
    setScreen('lobby');
  };

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem('token');
    socketService.disconnect();
    setUser(null);
    setToken('');
    setScreen('login');
  };

  const handleMatchFound = (data: any) => {
    setMatchData(data);
    // Vérifier si c'est un match solo
    if (data.isSolo) {
      setScreen('solo');
    } else {
      setScreen('game');
    }
  };

  const handleGameEnd = () => {
    setMatchData(null);
    setScreen('lobby');
  };

  return (
    <div>
      {screen === 'login' && <Login onLogin={handleLogin} />}
      {screen === 'lobby' && user && (
        <Lobby user={user} onMatchFound={handleMatchFound} onLogout={handleLogout} />
      )}
      {screen === 'game' && matchData && user && (
        <Game matchData={matchData} userId={user.id} onGameEnd={handleGameEnd} />
      )}
      {screen === 'solo' && matchData && (
        <SoloGame matchData={matchData} onGameEnd={handleGameEnd} />
      )}
    </div>
  );
}

export default App;
