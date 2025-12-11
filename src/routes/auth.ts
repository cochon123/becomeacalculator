import { Router, Response } from 'express';
import { UserService } from '../services/userService';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', async (req, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username et password requis' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Username doit faire au moins 3 caractères' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password doit faire au moins 6 caractères' });
      return;
    }

    const existing = UserService.findByUsername(username);
    if (existing) {
      res.status(409).json({ error: 'Username déjà pris' });
      return;
    }

    const user = await UserService.create(username, password);
    const token = generateToken({ userId: user.id, username: user.username });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        elo: user.elo,
      },
      token,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Login
router.post('/login', async (req, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username et password requis' });
      return;
    }

    const user = UserService.findByUsername(username);
    if (!user) {
      res.status(401).json({ error: 'Identifiants incorrects' });
      return;
    }

    const valid = await UserService.validatePassword(user, password);
    if (!valid) {
      res.status(401).json({ error: 'Identifiants incorrects' });
      return;
    }

    const token = generateToken({ userId: user.id, username: user.username });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        elo: user.elo,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = UserService.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    elo: user.elo,
    games_played: user.games_played,
    games_won: user.games_won,
  });
});

// Logout
router.post('/logout', (req, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnecté' });
});

export default router;
