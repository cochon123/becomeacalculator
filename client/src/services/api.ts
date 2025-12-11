// Utilise le proxy Vite en dev, ou l'URL configurée en prod
const API_URL = import.meta.env.VITE_API_URL || '';

interface AuthResponse {
  user: {
    id: number;
    username: string;
    elo: number;
  };
  token: string;
}

export const authService = {
  async register(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de l\'inscription');
    }

    return res.json();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de la connexion');
    }

    return res.json();
  },

  async me(): Promise<any> {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      credentials: 'include',
    });

    if (!res.ok) return null;
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },
};

export const leaderboardService = {
  async getLeaderboard(limit: number = 50) {
    const res = await fetch(`${API_URL}/api/leaderboard?limit=${limit}`);
    return res.json();
  },
};
