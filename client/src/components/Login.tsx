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
    <div className="app-container">
      <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 className="logo-text text-center">🧮 NoCalculator</h1>
        <h2 className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
          {isRegister ? 'Inscription' : 'Connexion'}
        </h2>

        <form onSubmit={handleSubmit} className="input-group">
          <input
            type="text"
            className="input-field"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-field"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <div style={{ color: 'var(--error-color)', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-4"
            style={{ width: '100%' }}
          >
            {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
          </button>
        </form>

        <p className="text-center mt-4" style={{ color: 'var(--text-secondary)' }}>
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
              color: 'var(--accent-color)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontWeight: 'bold'
            }}
          >
            {isRegister ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  );
}
