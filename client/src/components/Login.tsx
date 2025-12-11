import { useState, FormEvent } from 'react';
import { authService } from '../services/api';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = isRegister
        ? await authService.register(username, password)
        : await authService.login(username, password);

      onLogin(response.user, response.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>🧮 NoCalculator</h1>
      <h2 style={{ textAlign: 'center' }}>{isRegister ? 'Inscription' : 'Connexion'}</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
          required
        />
        
        {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
          }}
        >
          {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          style={{
            marginLeft: '5px',
            background: 'none',
            border: 'none',
            color: '#2196F3',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {isRegister ? 'Se connecter' : "S'inscrire"}
        </button>
      </p>
    </div>
  );
}
